import { describe, expect, it } from "vitest";
import { customerKey, customerStatement, customerSummaries, invoiceBalances } from "./ledger";
import { buildGstr1, buildGstr3b, toCsv } from "./gst";
import { buildOverview } from "./overview";
import { buildTallyXml, xmlEscape } from "./tally";
import { financialYearStart, monthRange } from "./period";
import type { AccExpense, AccInvoice, AccPayment } from "./types";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

function invoice(over: Partial<AccInvoice> & { id: string }): AccInvoice {
  return {
    invoiceNumber: `TZ/26-27/000${over.id}`,
    brand: "tzar",
    invoiceDate: d("2026-11-05"),
    status: "ISSUED",
    documentType: "TAX_INVOICE",
    customerName: "Kikabhai",
    customerGstin: "27AAAAA0000A1Z5",
    customerStateCode: "27",
    placeOfSupplyCode: "27",
    isInterState: false,
    items: [{ hsnSac: "998361", quantity: 1, gstRate: 18, taxableValue: 7200, cgst: 648, sgst: 648, igst: 0, unit: "NOS" }],
    totals: { taxableValue: 7200, cgst: 648, sgst: 648, igst: 0, roundOff: 0, grandTotal: 8496 },
    ...over,
  };
}

const interState = (id: string, gstin?: string, total = 11800): AccInvoice =>
  invoice({
    id,
    customerName: "Delhi Buyer",
    customerGstin: gstin,
    customerStateCode: "07",
    placeOfSupplyCode: "07",
    isInterState: true,
    items: [{ hsnSac: "998361", quantity: 1, gstRate: 18, taxableValue: total / 1.18, cgst: 0, sgst: 0, igst: total - total / 1.18, unit: "NOS" }],
    totals: { taxableValue: total / 1.18, cgst: 0, sgst: 0, igst: total - total / 1.18, roundOff: 0, grandTotal: total },
  });

const pay = (id: string, invoiceId: string, amount: number, date = "2026-11-10"): AccPayment => ({
  id,
  invoiceId,
  amount,
  date: d(date),
  mode: "UPI",
});

describe("ledger", () => {
  it("keys customers by GSTIN, else by normalised name", () => {
    expect(customerKey("A", "27aaaaa0000a1z5")).toBe("gstin:27AAAAA0000A1Z5");
    expect(customerKey("  Foo   Bar ")).toBe("name:foo bar");
  });

  it("works out paid and outstanding per invoice, ignoring proformas and cancelled", () => {
    const inv = [
      invoice({ id: "1" }),
      invoice({ id: "2", status: "CANCELLED" }),
      invoice({ id: "3", documentType: "PROFORMA" }),
    ];
    const b = invoiceBalances(inv, [pay("p1", "1", 3000)]);
    expect(b).toHaveLength(1);
    expect(b[0].paid).toBe(3000);
    expect(b[0].outstanding).toBe(5496);
  });

  it("builds a statement with a running balance and summaries", () => {
    const inv = [invoice({ id: "1" }), invoice({ id: "2", invoiceDate: d("2026-11-20") })];
    const payments = [pay("p1", "1", 8496, "2026-11-05"), pay("p2", "2", 1000, "2026-11-25")];
    const key = customerKey("Kikabhai", "27AAAAA0000A1Z5");
    const lines = customerStatement(key, inv, payments);
    expect(lines.map((l) => l.balance)).toEqual([8496, 0, 8496, 7496]);
    const [s] = customerSummaries(inv, payments);
    expect(s.invoiced).toBe(16992);
    expect(s.received).toBe(9496);
    expect(s.balance).toBe(7496);
  });
});

describe("GSTR-1", () => {
  it("splits B2B, B2C large and B2C small, and ignores proforma/cancelled", () => {
    const inv = [
      invoice({ id: "1" }),
      interState("2", undefined, 300000),
      interState("3", undefined, 11800),
      invoice({ id: "4", customerGstin: undefined }),
      invoice({ id: "5", status: "CANCELLED" }),
      invoice({ id: "6", documentType: "PROFORMA" }),
    ];
    const g = buildGstr1(inv);
    expect(g.b2b).toHaveLength(1);
    expect(g.b2b[0]).toMatchObject({ gstin: "27AAAAA0000A1Z5", taxable: 7200, cgst: 648, sgst: 648 });
    expect(g.b2cl).toHaveLength(1);
    expect(g.b2cl[0].invoiceValue).toBe(300000);
    // small inter-state (07) and small intra-state (27) are summarised separately
    expect(g.b2cs.map((r) => `${r.placeOfSupply}:${r.type}`).sort()).toEqual(["07:Inter-State", "27:Intra-State"]);
    expect(g.documents).toMatchObject({ total: 5, cancelled: 1 });
  });

  it("rolls the HSN summary up and flags missing HSN codes", () => {
    const noHsn = invoice({ id: "9", items: [{ quantity: 1, gstRate: 18, taxableValue: 100, cgst: 9, sgst: 9, igst: 0 }] });
    const g = buildGstr1([invoice({ id: "1" }), invoice({ id: "2" }), noHsn]);
    expect(g.hsn).toHaveLength(1);
    expect(g.hsn[0]).toMatchObject({ hsn: "998361", taxable: 14400, cgst: 1296, quantity: 2 });
    expect(g.issues[0]).toContain("no HSN/SAC");
  });
});

describe("GSTR-3B and overview", () => {
  const exp = (id: string, itc: boolean, over: Partial<AccExpense> = {}): AccExpense => ({
    id,
    expenseDate: d("2026-11-08"),
    brand: "general",
    category: "Software & Subscriptions",
    vendorName: "SaaS Inc",
    taxableValue: 1000,
    cgst: 90,
    sgst: 90,
    igst: 0,
    total: 1180,
    itcEligible: itc,
    ...over,
  });

  it("nets claimable input credit against tax collected", () => {
    const t = buildGstr3b([invoice({ id: "1" })], [exp("e1", true), exp("e2", false)]);
    expect(t.outward).toEqual({ taxable: 7200, igst: 0, cgst: 648, sgst: 648 });
    expect(t.itc).toEqual({ igst: 0, cgst: 90, sgst: 90 });
    expect(t.payable).toEqual({ igst: 0, cgst: 558, sgst: 558, total: 1116 });
    expect(t.itcBills).toBe(1);
  });

  it("explains when credit exceeds tax collected", () => {
    const t = buildGstr3b([], [exp("e1", true)]);
    expect(t.payable.cgst).toBe(-90);
    expect(t.notes).toHaveLength(1);
  });

  it("computes earned versus spent: claimable GST is not a cost, unclaimable GST is", () => {
    const o = buildOverview([invoice({ id: "1" })], [pay("p1", "1", 5000)], [exp("e1", true), exp("e2", false)]);
    expect(o.earned).toBe(7200);
    expect(o.spent).toBe(1000 + 1180);
    expect(o.profit).toBe(7200 - 2180);
    expect(o.gstPayable).toBe(1296 - 180);
    expect(o.outstanding).toBe(3496);
    expect(o.monthly).toEqual([{ month: "2026-11", earned: 7200, spent: 2180 }]);
  });
});

describe("Tally export", () => {
  it("escapes XML special characters", () => {
    expect(xmlEscape(`A & B <"x">`)).toBe("A &amp; B &lt;&quot;x&quot;&gt;");
  });

  it("writes a balanced sales voucher: party debit equals credits", () => {
    const xml = buildTallyXml({ invoices: [invoice({ id: "1" })], payments: [pay("p1", "1", 1000)], expenses: [] });
    expect(xml).toContain("<VOUCHERNUMBER>TZ/26-27/0001</VOUCHERNUMBER>");
    expect(xml).toContain("<AMOUNT>-8496.00</AMOUNT>");
    expect(xml).toContain("<LEDGERNAME>Output CGST</LEDGERNAME>");
    expect(xml).toContain('VCHTYPE="Receipt"');
    expect(xml).toContain("<DATE>20261105</DATE>");
    // no IGST line on an intra-state sale
    expect(xml).not.toContain("Output IGST</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>0.00");
  });

  it("books unclaimable GST into the expense and puts a payable vendor on unpaid bills", () => {
    const e: AccExpense & { paymentStatus: "UNPAID" } = {
      id: "e1",
      expenseDate: d("2026-11-08"),
      brand: "general",
      category: "Rent",
      vendorName: "Landlord & Sons",
      taxableValue: 1000,
      cgst: 90,
      sgst: 90,
      igst: 0,
      total: 1180,
      itcEligible: false,
      paymentStatus: "UNPAID",
    };
    const xml = buildTallyXml({ invoices: [], payments: [], expenses: [e] });
    expect(xml).toContain("<AMOUNT>-1180.00</AMOUNT>");
    expect(xml).toContain("Landlord &amp; Sons");
    expect(xml).toContain('VCHTYPE="Journal"');
  });
});

describe("helpers", () => {
  it("handles month and financial-year boundaries", () => {
    expect(monthRange("2026-12").end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    expect(() => monthRange("2026-13")).toThrow();
    expect(financialYearStart(d("2027-03-31"))).toBe(2026);
    expect(financialYearStart(d("2027-04-01"))).toBe(2027);
  });

  it("writes safe CSV", () => {
    expect(toCsv(["a", "b"], [["x,y", '=SUM(1)'], [1, 2]])).toBe('a,b\r\n"x,y",\'=SUM(1)\r\n1,2\r\n');
  });
});
