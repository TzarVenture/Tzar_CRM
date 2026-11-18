"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2, Loader2, Wallet, Repeat } from "lucide-react";
import { formatINR } from "@/lib/invoice/calc";
import { formatInvoiceDate } from "@/lib/invoice/config";
import { EXPENSE_BRANDS, EXPENSE_BRAND_LABELS, EXPENSE_CATEGORIES } from "@/lib/expense/config";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
import { ExpenseForm, ExpenseRecord, KnownVendor } from "./ExpenseForm";

interface Summary {
  total: number;
  taxableValue: number;
  gstPaid: number;
  itc: number;
  unpaid: number;
  count: number;
}

const EMPTY_SUMMARY: Summary = { total: 0, taxableValue: 0, gstPaid: 0, itc: 0, unpaid: 0, count: 0 };

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** First and last day of a YYYY-MM month. Empty month means no date limit. */
function monthRange(month: string): { from: string; to: string } {
  if (!month) return { from: "", to: "" };
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

const selectClass =
  "px-3 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white outline-none cursor-pointer";

export default function ExpenseCenter() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [vendors, setVendors] = useState<KnownVendor[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [byCategory, setByCategory] = useState<Record<string, number>>({});

  const [month, setMonth] = useState(currentMonth());
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ source: ExpenseRecord | null } | null>(null);
  const [toDelete, setToDelete] = useState<ExpenseRecord | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get("/api/v1/expenses", {
        params: { ...monthRange(month), brand, category, search },
      });
      setExpenses(res.data.expenses || []);
      setVendors(res.data.vendors || []);
      setSummary(res.data.summary || EMPTY_SUMMARY);
      setByCategory(res.data.byCategory || {});
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load expenses.");
    } finally {
      setIsLoading(false);
    }
  }, [month, brand, category, search]);

  // Debounced so typing in the search box does not fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(fetchExpenses, 250);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const deleteExpense = async () => {
    if (!toDelete) return;
    const id = toDelete._id;
    setToDelete(null);
    try {
      await axios.delete(`/api/v1/expenses/${id}`);
      await fetchExpenses();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete expense.");
    }
  };

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const renderActions = (expense: ExpenseRecord) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => setForm({ source: expense })}
        title="Edit expense"
        aria-label="Edit expense"
        className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={() => setToDelete(expense)}
        title="Delete expense"
        aria-label="Delete expense"
        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const tags = (expense: ExpenseRecord) => (
    <span className="inline-flex flex-wrap items-center gap-1">
      {expense.recurring !== "NONE" && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
          <Repeat className="w-3 h-3" /> {expense.recurring === "MONTHLY" ? "Monthly" : "Yearly"}
        </span>
      )}
      {expense.paymentStatus === "UNPAID" && (
        <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">Unpaid</span>
      )}
      {expense.itcEligible && (
        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          GST credit
        </span>
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total spent</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">₹{formatINR(summary.total)}</p>
          <p className="text-xs font-medium text-slate-500">
            {summary.count} expense{summary.count === 1 ? "" : "s"}
            {month ? ` in ${formatInvoiceDate(`${month}-01`).slice(3)}` : " in all time"} · ₹
            {formatINR(summary.taxableValue)} before GST
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">GST credit to claim</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">₹{formatINR(summary.itc)}</p>
          <p className="text-xs font-medium text-slate-500">of ₹{formatINR(summary.gstPaid)} GST paid</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Still to pay</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">₹{formatINR(summary.unpaid)}</p>
          <p className="text-xs font-medium text-slate-500">Bills marked not paid yet</p>
        </div>
      </div>

      {topCategories.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Where the money went</p>
          {topCategories.map(([name, amount]) => (
            <div key={name} className="flex items-center gap-3 text-sm font-medium">
              <span className="w-44 shrink-0 truncate text-slate-700">{name}</span>
              <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-slate-800"
                  style={{ width: `${summary.total ? Math.max((amount / summary.total) * 100, 2) : 0}%` }}
                />
              </span>
              <span className="w-28 shrink-0 text-right text-slate-900">₹{formatINR(amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor, bill number or note"
            aria-label="Search expenses"
            className="w-full pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white outline-none focus:border-slate-800"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label="Month"
            className={selectClass}
          />
          {month && (
            <button onClick={() => setMonth("")} className="px-3 py-2.5 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer">
              Show all time
            </button>
          )}
          <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Filter by brand" className={selectClass}>
            <option value="all">All brands</option>
            {EXPENSE_BRANDS.map((b) => (
              <option key={b} value={b}>
                {EXPENSE_BRAND_LABELS[b]}
              </option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className={selectClass}>
            <option value="all">All categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setForm({ source: null })}
          className="lg:ml-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-slate-900 hover:bg-slate-800 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-16 bg-white rounded-2xl border border-slate-200 text-sm font-medium text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading expenses...
        </div>
      ) : expenses.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
          <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-semibold text-slate-900">No expenses found</p>
          <p className="text-sm font-medium text-slate-500">
            {search || brand !== "all" || category !== "all"
              ? "Try clearing the search or filters."
              : "Nothing recorded for this period. Add a bill or subscription with Add Expense."}
          </p>
        </div>
      ) : (
        <>
          <ul className="md:hidden space-y-2.5">
            {expenses.map((expense) => (
              <li key={expense._id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-slate-900 truncate">{expense.vendorName}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {formatInvoiceDate(expense.expenseDate)} · {expense.category}
                    </p>
                    {expense.description && (
                      <p className="text-xs font-medium text-slate-500 truncate">{expense.description}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-base font-bold text-slate-900">₹{formatINR(expense.total)}</p>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                  {tags(expense)}
                  {renderActions(expense)}
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wider text-slate-500 uppercase border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Before GST</th>
                  <th className="px-4 py-3 text-right">GST</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                      {formatInvoiceDate(expense.expenseDate)}
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="font-semibold text-slate-900 truncate">{expense.vendorName}</p>
                      <p className="font-medium text-slate-500 truncate">
                        {[expense.billNumber, expense.description].filter(Boolean).join(" · ")}
                      </p>
                      {tags(expense)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-600">{expense.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                      {EXPENSE_BRAND_LABELS[expense.brand]?.replace(" (whole business)", "")}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 text-right whitespace-nowrap">
                      ₹{formatINR(expense.taxableValue)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 text-right whitespace-nowrap">
                      {expense.taxAmount ? `₹${formatINR(expense.taxAmount)}` : "-"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 text-right whitespace-nowrap">
                      ₹{formatINR(expense.total)}
                    </td>
                    <td className="px-4 py-3">{renderActions(expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {form && (
        <ExpenseForm
          key={form.source?._id || "new"}
          source={form.source}
          vendors={vendors}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            fetchExpenses();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete this expense?"
          message={`${toDelete.vendorName}, ₹${formatINR(toDelete.total)} on ${formatInvoiceDate(
            toDelete.expenseDate
          )}. This cannot be undone.`}
          confirmLabel="Delete expense"
          cancelLabel="Keep expense"
          onConfirm={deleteExpense}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
