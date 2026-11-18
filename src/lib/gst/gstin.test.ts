import { describe, expect, it } from "vitest";
import { checkGstin } from "./gstin";
import { computeExpense } from "@/lib/expense/calc";
import { ExpenseInputSchema } from "@/lib/expense/service";
import { getFinancialYear, formatInvoiceNumber, invoiceCounterKey } from "@/lib/invoice/config";

describe("checkGstin", () => {
  it.each(["27ASYPR9821N1ZF", "27AADFK7869E1Z0", "06AANCM5586H1ZY"])("accepts the real GSTIN %s", (gstin) => {
    expect(checkGstin(gstin)).toBeNull();
  });

  it("rejects a GSTIN with one mistyped character", () => {
    expect(checkGstin("27ASYPR9821N1ZG")).toBe("checksum");
    expect(checkGstin("27ASYPR9812N1ZF")).toBe("checksum");
  });

  it.each(["", "27ASYPR9821N1Z", "27asypr9821n1zf", "2XASYPR9821N1ZF", "27ASYPR9821N1YF"])(
    "rejects the badly formed value %j",
    (gstin) => {
      expect(checkGstin(gstin)).toBe("format");
    }
  );
});

describe("computeExpense", () => {
  it("records CGST and SGST on a bill from a vendor in our state", () => {
    expect(computeExpense({ taxableValue: 7200, gstRate: 18, vendorStateCode: "27", ourStateCode: "27" })).toEqual({
      isInterState: false,
      taxableValue: 7200,
      cgst: 648,
      sgst: 648,
      igst: 0,
      taxAmount: 1296,
      total: 8496,
    });
  });

  it("records IGST on a bill from a vendor in another state", () => {
    const result = computeExpense({ taxableValue: 999, gstRate: 18, vendorStateCode: "29", ourStateCode: "27" });
    expect(result).toMatchObject({ isInterState: true, cgst: 0, sgst: 0, igst: 179.82, total: 1178.82 });
  });

  it("adds no tax when the bill carries no GST", () => {
    expect(computeExpense({ taxableValue: 499, gstRate: 0, vendorStateCode: "27", ourStateCode: "27" }).total).toBe(499);
  });
});

describe("ExpenseInputSchema", () => {
  const valid = {
    expenseDate: "2026-11-13",
    category: "Packaging",
    vendorName: "Sample Packaging Supplier",
    vendorGstin: "27AADFK7869E1Z0",
    vendorStateCode: "27",
    taxableValue: 7200,
    gstRate: 18,
    itcEligible: true,
  };
  const firstError = (input: object) => {
    const parsed = ExpenseInputSchema.safeParse(input);
    return parsed.success ? null : parsed.error.issues[0].message;
  };

  it("accepts a complete supplier bill", () => {
    expect(firstError(valid)).toBeNull();
  });

  it("refuses GST on a bill from a vendor with no GSTIN", () => {
    expect(firstError({ ...valid, vendorGstin: "", itcEligible: false })).toMatch(/GSTIN/);
  });

  it("refuses input credit when no GST was charged", () => {
    expect(firstError({ ...valid, gstRate: 0 })).toMatch(/Input credit/);
  });

  it("refuses a GSTIN from a different state than the one selected", () => {
    expect(firstError({ ...valid, vendorStateCode: "29" })).toMatch(/state code/);
  });

  it("refuses a zero amount and a future date", () => {
    expect(firstError({ ...valid, taxableValue: 0 })).toMatch(/more than 0/);
    expect(firstError({ ...valid, expenseDate: "2099-01-01" })).toMatch(/future/);
  });
});

describe("invoice numbering", () => {
  it("uses the April to March financial year", () => {
    expect(getFinancialYear("2026-03-31")).toBe("25-26");
    expect(getFinancialYear("2026-04-01")).toBe("26-27");
    expect(getFinancialYear("2026-11-13")).toBe("26-27");
    expect(getFinancialYear("2027-01-15")).toBe("26-27");
  });

  it("stays within the 16-character limit for invoice numbers", () => {
    expect(formatInvoiceNumber("crownleaf", "26-27", 1)).toBe("CL/26-27/0001");
    expect(formatInvoiceNumber("tzar", "26-27", 99999).length).toBeLessThanOrEqual(16);
  });

  it("numbers proformas on their own series so they never use a tax invoice number", () => {
    expect(formatInvoiceNumber("crownleaf", "26-27", 1, "PROFORMA")).toBe("CL/PI/26-27/0001");
    expect(invoiceCounterKey("crownleaf", "26-27", "PROFORMA")).not.toBe(invoiceCounterKey("crownleaf", "26-27"));
    expect(formatInvoiceNumber("tzar", "26-27", 9999, "PROFORMA").length).toBeLessThanOrEqual(16);
  });
});
