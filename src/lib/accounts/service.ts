import dbConnect from "@/lib/db";
import Invoice, { IInvoice } from "@/models/Invoice";
import Expense, { IExpense } from "@/models/Expense";
import Payment, { IPayment } from "@/models/Payment";
import type { AccExpense, AccInvoice, AccPayment } from "./types";

export function toAccInvoice(i: IInvoice): AccInvoice {
  return {
    id: String(i._id),
    invoiceNumber: i.invoiceNumber || "",
    brand: i.brand,
    invoiceDate: i.invoiceDate,
    status: i.status,
    documentType: i.documentType || "TAX_INVOICE",
    customerName: i.customer.name,
    customerGstin: i.customer.gstin || undefined,
    customerStateCode: i.customer.stateCode,
    placeOfSupplyCode: i.placeOfSupplyCode,
    isInterState: !!i.isInterState,
    items: (i.items || []).map((it) => ({
      hsnSac: it.hsnSac,
      unit: it.unit,
      quantity: it.quantity,
      gstRate: it.gstRate,
      taxableValue: it.taxableValue ?? 0,
      cgst: it.cgst ?? 0,
      sgst: it.sgst ?? 0,
      igst: it.igst ?? 0,
    })),
    totals: {
      taxableValue: i.totals?.taxableValue ?? 0,
      cgst: i.totals?.cgst ?? 0,
      sgst: i.totals?.sgst ?? 0,
      igst: i.totals?.igst ?? 0,
      roundOff: i.totals?.roundOff ?? 0,
      grandTotal: i.totals?.grandTotal ?? 0,
    },
  };
}

export function toAccPayment(p: IPayment): AccPayment {
  return { id: String(p._id), invoiceId: String(p.invoice), date: p.date, amount: p.amount, mode: p.mode, reference: p.reference };
}

export function toAccExpense(e: IExpense): AccExpense & { paymentMode: string; paymentStatus: "PAID" | "UNPAID" } {
  return {
    id: String(e._id),
    expenseDate: e.expenseDate,
    brand: e.brand,
    category: e.category,
    vendorName: e.vendorName,
    vendorGstin: e.vendorGstin,
    billNumber: e.billNumber,
    taxableValue: e.taxableValue,
    cgst: e.cgst,
    sgst: e.sgst,
    igst: e.igst,
    total: e.total,
    itcEligible: e.itcEligible,
    paymentMode: e.paymentMode,
    paymentStatus: e.paymentStatus,
  };
}

/** Everything the accounting views need for a date range [start, end). Invoices outside it are not loaded. */
export async function loadBooks(range?: { start: Date; end: Date }) {
  await dbConnect();
  const invoiceFilter = {
    status: { $in: ["ISSUED", "CANCELLED"] as ("ISSUED" | "CANCELLED")[] },
    ...(range ? { invoiceDate: { $gte: range.start, $lt: range.end } } : {}),
  };
  const [invoices, expenses] = await Promise.all([
    Invoice.find(invoiceFilter).sort({ invoiceDate: 1, invoiceNumber: 1 }),
    Expense.find(range ? { expenseDate: { $gte: range.start, $lt: range.end } } : {}).sort({ expenseDate: 1 }),
  ]);
  const invoiceIds = invoices.map((i) => i._id);
  const payments = await Payment.find({ invoice: { $in: invoiceIds } }).sort({ date: 1 });
  return {
    invoices: invoices.map(toAccInvoice),
    expenses: expenses.map(toAccExpense),
    payments: payments.map(toAccPayment),
  };
}
