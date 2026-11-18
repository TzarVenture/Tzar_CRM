import { round2 } from "@/lib/invoice/calc";
import { AccInvoice, AccPayment, isSale } from "./types";

/** Identity of a customer across invoices: GSTIN when present, otherwise the typed name. */
export function customerKey(name: string, gstin?: string): string {
  const g = (gstin || "").trim().toUpperCase();
  return g ? `gstin:${g}` : `name:${name.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

export interface InvoiceBalance {
  invoice: AccInvoice;
  paid: number;
  outstanding: number;
}

export function invoiceBalances(invoices: AccInvoice[], payments: AccPayment[]): InvoiceBalance[] {
  const paidBy = new Map<string, number>();
  for (const p of payments) paidBy.set(p.invoiceId, round2((paidBy.get(p.invoiceId) || 0) + p.amount));
  return invoices.filter(isSale).map((invoice) => {
    const paid = paidBy.get(invoice.id) || 0;
    return { invoice, paid, outstanding: round2(invoice.totals.grandTotal - paid) };
  });
}

export interface CustomerSummary {
  key: string;
  name: string;
  gstin?: string;
  invoiced: number;
  received: number;
  balance: number;
  invoiceCount: number;
}

export function customerSummaries(invoices: AccInvoice[], payments: AccPayment[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();
  for (const b of invoiceBalances(invoices, payments)) {
    const inv = b.invoice;
    const key = customerKey(inv.customerName, inv.customerGstin);
    const row: CustomerSummary = map.get(key) || {
      key,
      name: inv.customerName,
      gstin: inv.customerGstin || undefined,
      invoiced: 0,
      received: 0,
      balance: 0,
      invoiceCount: 0,
    };
    row.invoiced = round2(row.invoiced + inv.totals.grandTotal);
    row.received = round2(row.received + b.paid);
    row.balance = round2(row.invoiced - row.received);
    row.invoiceCount += 1;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

export interface StatementLine {
  date: Date;
  type: "INVOICE" | "PAYMENT";
  ref: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentId?: string;
}

/** Ledger-style statement: invoices debit the customer, receipts credit them, with a running balance. */
export function customerStatement(key: string, invoices: AccInvoice[], payments: AccPayment[]): StatementLine[] {
  const mine = invoices.filter((i) => isSale(i) && customerKey(i.customerName, i.customerGstin) === key);
  const numberById = new Map(mine.map((i) => [i.id, i.invoiceNumber]));
  const lines: Omit<StatementLine, "balance">[] = [
    ...mine.map((i) => ({
      date: i.invoiceDate,
      type: "INVOICE" as const,
      ref: i.invoiceNumber,
      description: "Tax invoice",
      debit: i.totals.grandTotal,
      credit: 0,
    })),
    ...payments
      .filter((p) => numberById.has(p.invoiceId))
      .map((p) => ({
        date: p.date,
        type: "PAYMENT" as const,
        ref: p.reference || p.mode,
        description: `Received (${p.mode}) against ${numberById.get(p.invoiceId)}`,
        paymentId: p.id,
        debit: 0,
        credit: p.amount,
      })),
  ];
  // On the same day the invoice comes first, so a same-day payment never shows a negative balance
  lines.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      (a.type === "INVOICE" ? 0 : 1) - (b.type === "INVOICE" ? 0 : 1)
  );
  let balance = 0;
  return lines.map((l) => {
    balance = round2(balance + l.debit - l.credit);
    return { ...l, balance };
  });
}
