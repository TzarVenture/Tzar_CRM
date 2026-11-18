import { round2 } from "@/lib/invoice/calc";
import { invoiceBalances } from "./ledger";
import { monthKey } from "./period";
import { AccExpense, AccInvoice, AccPayment, isSale } from "./types";

export interface MonthPoint {
  month: string;
  earned: number;
  spent: number;
}

export interface Overview {
  /** Sales before GST */
  earned: number;
  /** Expenses before GST that can be claimed, plus full cost of those that cannot */
  spent: number;
  profit: number;
  gstCollected: number;
  itcAvailable: number;
  gstPayable: number;
  received: number;
  outstanding: number;
  invoiceCount: number;
  expenseCount: number;
  byBrand: { brand: string; earned: number; spent: number }[];
  byCategory: { category: string; amount: number }[];
  monthly: MonthPoint[];
  topDebtors: { name: string; outstanding: number }[];
}

/** An expense's cost to the business: claimable GST is not a cost, unclaimable GST is. */
export function expenseCost(e: AccExpense): number {
  return e.itcEligible ? e.taxableValue : e.total;
}

/** Earned-versus-spent view for any set of invoices, payments and expenses (the caller chooses the date range). */
export function buildOverview(invoices: AccInvoice[], payments: AccPayment[], expenses: AccExpense[]): Overview {
  const sales = invoices.filter(isSale);
  const balances = invoiceBalances(invoices, payments);

  const earned = round2(sales.reduce((s, i) => s + i.totals.taxableValue, 0));
  const spent = round2(expenses.reduce((s, e) => s + expenseCost(e), 0));
  const gstCollected = round2(sales.reduce((s, i) => s + i.totals.cgst + i.totals.sgst + i.totals.igst, 0));
  const itcAvailable = round2(expenses.filter((e) => e.itcEligible).reduce((s, e) => s + e.cgst + e.sgst + e.igst, 0));

  const brands = new Map<string, { brand: string; earned: number; spent: number }>();
  const brandRow = (b: string) => {
    const r = brands.get(b) || { brand: b, earned: 0, spent: 0 };
    brands.set(b, r);
    return r;
  };
  for (const i of sales) brandRow(i.brand).earned = round2(brandRow(i.brand).earned + i.totals.taxableValue);
  for (const e of expenses) brandRow(e.brand).spent = round2(brandRow(e.brand).spent + expenseCost(e));

  const categories = new Map<string, number>();
  for (const e of expenses) categories.set(e.category, round2((categories.get(e.category) || 0) + expenseCost(e)));

  const months = new Map<string, MonthPoint>();
  const point = (m: string) => {
    const p = months.get(m) || { month: m, earned: 0, spent: 0 };
    months.set(m, p);
    return p;
  };
  for (const i of sales) point(monthKey(i.invoiceDate)).earned += i.totals.taxableValue;
  for (const e of expenses) point(monthKey(e.expenseDate)).spent += expenseCost(e);

  const debtors = new Map<string, number>();
  for (const b of balances) {
    if (b.outstanding > 0) debtors.set(b.invoice.customerName, round2((debtors.get(b.invoice.customerName) || 0) + b.outstanding));
  }

  return {
    earned,
    spent,
    profit: round2(earned - spent),
    gstCollected,
    itcAvailable,
    gstPayable: round2(gstCollected - itcAvailable),
    received: round2(balances.reduce((s, b) => s + b.paid, 0)),
    outstanding: round2(balances.reduce((s, b) => s + Math.max(b.outstanding, 0), 0)),
    invoiceCount: sales.length,
    expenseCount: expenses.length,
    byBrand: [...brands.values()].sort((a, b) => b.earned - a.earned),
    byCategory: [...categories].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount),
    monthly: [...months.values()]
      .map((m) => ({ month: m.month, earned: round2(m.earned), spent: round2(m.spent) }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    topDebtors: [...debtors].map(([name, outstanding]) => ({ name, outstanding })).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
  };
}
