import { round2 } from "@/lib/invoice/calc";
import { AccExpense, AccInvoice, isSale } from "./types";
import { formatDMY } from "./period";

const B2CL_THRESHOLD = 250000; // inter-state B2C invoices above this are reported one by one

export interface RateRow {
  rate: number;
  taxable: number;
  igst: number;
  cgst: number;
  sgst: number;
}

function rateRows(inv: AccInvoice): RateRow[] {
  const m = new Map<number, RateRow>();
  for (const it of inv.items) {
    const r = m.get(it.gstRate) || { rate: it.gstRate, taxable: 0, igst: 0, cgst: 0, sgst: 0 };
    r.taxable = round2(r.taxable + it.taxableValue);
    r.igst = round2(r.igst + it.igst);
    r.cgst = round2(r.cgst + it.cgst);
    r.sgst = round2(r.sgst + it.sgst);
    m.set(it.gstRate, r);
  }
  return [...m.values()].sort((a, b) => a.rate - b.rate);
}

export interface InvoiceRateRow extends RateRow {
  gstin: string;
  customer: string;
  invoiceNumber: string;
  date: string;
  invoiceValue: number;
  placeOfSupply: string;
}

export interface B2csRow extends RateRow {
  placeOfSupply: string;
  type: "Intra-State" | "Inter-State";
}

export interface HsnRow extends RateRow {
  hsn: string;
  uqc: string;
  quantity: number;
}

export interface Gstr1 {
  b2b: InvoiceRateRow[];
  b2cl: InvoiceRateRow[];
  b2cs: B2csRow[];
  hsn: HsnRow[];
  documents: { from: string; to: string; total: number; cancelled: number };
  issues: string[];
}

/** GSTR-1 working sheets from one month's invoices. Filing itself is done on the GST portal. */
export function buildGstr1(allInMonth: AccInvoice[]): Gstr1 {
  const sales = allInMonth.filter(isSale);
  const b2b: InvoiceRateRow[] = [];
  const b2cl: InvoiceRateRow[] = [];
  const b2csMap = new Map<string, B2csRow>();
  const hsnMap = new Map<string, HsnRow>();
  const issues: string[] = [];

  for (const inv of sales) {
    const base = {
      gstin: inv.customerGstin || "",
      customer: inv.customerName,
      invoiceNumber: inv.invoiceNumber,
      date: formatDMY(inv.invoiceDate),
      invoiceValue: inv.totals.grandTotal,
      placeOfSupply: inv.placeOfSupplyCode,
    };
    for (const r of rateRows(inv)) {
      if (inv.customerGstin) {
        b2b.push({ ...base, ...r });
      } else if (inv.isInterState && inv.totals.grandTotal > B2CL_THRESHOLD) {
        b2cl.push({ ...base, ...r });
      } else {
        const type = inv.isInterState ? "Inter-State" : "Intra-State";
        const key = `${inv.placeOfSupplyCode}|${type}|${r.rate}`;
        const row: B2csRow = b2csMap.get(key) || {
          placeOfSupply: inv.placeOfSupplyCode,
          type,
          rate: r.rate,
          taxable: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
        };
        row.taxable = round2(row.taxable + r.taxable);
        row.igst = round2(row.igst + r.igst);
        row.cgst = round2(row.cgst + r.cgst);
        row.sgst = round2(row.sgst + r.sgst);
        b2csMap.set(key, row);
      }
    }

    for (const it of inv.items) {
      const hsn = (it.hsnSac || "").trim();
      if (!hsn) {
        issues.push(`${inv.invoiceNumber}: an item has no HSN/SAC code (needed for the HSN summary).`);
        continue;
      }
      const uqc = it.unit || "NOS";
      const key = `${hsn}|${it.gstRate}|${uqc}`;
      const row: HsnRow = hsnMap.get(key) || { hsn, uqc, rate: it.gstRate, quantity: 0, taxable: 0, igst: 0, cgst: 0, sgst: 0 };
      row.quantity = round2(row.quantity + it.quantity);
      row.taxable = round2(row.taxable + it.taxableValue);
      row.igst = round2(row.igst + it.igst);
      row.cgst = round2(row.cgst + it.cgst);
      row.sgst = round2(row.sgst + it.sgst);
      hsnMap.set(key, row);
    }
  }

  const taxDocs = allInMonth.filter(
    (i) => (i.status === "ISSUED" || i.status === "CANCELLED") && i.documentType === "TAX_INVOICE"
  );
  const numbers = taxDocs.map((i) => i.invoiceNumber).sort();
  return {
    b2b,
    b2cl,
    b2cs: [...b2csMap.values()],
    hsn: [...hsnMap.values()],
    documents: {
      from: numbers[0] || "",
      to: numbers[numbers.length - 1] || "",
      total: taxDocs.length,
      cancelled: taxDocs.filter((i) => i.status === "CANCELLED").length,
    },
    issues: [...new Set(issues)],
  };
}

export interface Gstr3b {
  outward: { taxable: number; igst: number; cgst: number; sgst: number };
  itc: { igst: number; cgst: number; sgst: number };
  payable: { igst: number; cgst: number; sgst: number; total: number };
  itcBills: number;
  notes: string[];
}

/** GSTR-3B summary: tax collected (3.1a), input credit (4A) and the net per head. */
export function buildGstr3b(invoices: AccInvoice[], expenses: AccExpense[]): Gstr3b {
  const out = { taxable: 0, igst: 0, cgst: 0, sgst: 0 };
  for (const inv of invoices.filter(isSale)) {
    out.taxable += inv.totals.taxableValue;
    out.igst += inv.totals.igst;
    out.cgst += inv.totals.cgst;
    out.sgst += inv.totals.sgst;
  }
  const claim = expenses.filter((e) => e.itcEligible);
  const itc = { igst: 0, cgst: 0, sgst: 0 };
  for (const e of claim) {
    itc.igst += e.igst;
    itc.cgst += e.cgst;
    itc.sgst += e.sgst;
  }
  const payable = {
    igst: round2(out.igst - itc.igst),
    cgst: round2(out.cgst - itc.cgst),
    sgst: round2(out.sgst - itc.sgst),
    total: 0,
  };
  payable.total = round2(payable.igst + payable.cgst + payable.sgst);
  const notes: string[] = [];
  if (payable.igst < 0 || payable.cgst < 0 || payable.sgst < 0) {
    notes.push(
      "A negative figure means credit is more than tax collected for that head. Cross-set-off (IGST credit against CGST/SGST) and carry-forward are applied on the GST portal."
    );
  }
  return {
    outward: { taxable: round2(out.taxable), igst: round2(out.igst), cgst: round2(out.cgst), sgst: round2(out.sgst) },
    itc: { igst: round2(itc.igst), cgst: round2(itc.cgst), sgst: round2(itc.sgst) },
    payable,
    itcBills: claim.length,
    notes,
  };
}

/** CSV text. Quotes fields and neutralises spreadsheet formulas typed into names. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (typeof v === "string" && /^[=+\-@]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
