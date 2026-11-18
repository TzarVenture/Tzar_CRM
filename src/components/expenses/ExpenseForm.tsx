"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { SpinnerGap as Loader2, FloppyDisk as Save, X } from "@phosphor-icons/react";
import { formatINR } from "@/lib/invoice/calc";
import { SELLER, INDIAN_STATES, GST_RATES, toIsoDate } from "@/lib/invoice/config";
import { computeExpense } from "@/lib/expense/calc";
import {
  EXPENSE_BRANDS,
  EXPENSE_BRAND_LABELS,
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  RECURRING_OPTIONS,
  RECURRING_LABELS,
} from "@/lib/expense/config";
import { inputClass, labelClass } from "@/components/invoices/types";

export interface ExpenseRecord {
  _id: string;
  expenseDate: string;
  brand: (typeof EXPENSE_BRANDS)[number];
  category: (typeof EXPENSE_CATEGORIES)[number];
  vendorName: string;
  vendorGstin?: string;
  vendorStateCode: string;
  billNumber?: string;
  description?: string;
  taxableValue: number;
  gstRate: number;
  taxAmount: number;
  total: number;
  itcEligible: boolean;
  paymentMode: (typeof PAYMENT_MODES)[number];
  paymentStatus: "PAID" | "UNPAID";
  recurring: (typeof RECURRING_OPTIONS)[number];
}

export interface KnownVendor {
  vendorName: string;
  vendorGstin?: string;
  vendorStateCode?: string;
  category?: ExpenseRecord["category"];
  gstRate?: number;
  brand?: ExpenseRecord["brand"];
  recurring?: ExpenseRecord["recurring"];
}

interface ExpenseFormProps {
  source: ExpenseRecord | null;
  vendors: KnownVendor[];
  onClose: () => void;
  onSaved: () => void;
}

const invalidClass = "peer user-invalid:border-destructive user-invalid:bg-destructive-soft";
const fieldErrorClass = "hidden peer-user-invalid:block mt-1 text-xs font-medium text-destructive";

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function ExpenseForm({ source, vendors, onClose, onSaved }: ExpenseFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [expenseDate, setExpenseDate] = useState(source ? toIsoDate(source.expenseDate) : todayIso());
  const [brand, setBrand] = useState<ExpenseRecord["brand"]>(source?.brand || "general");
  const [category, setCategory] = useState<ExpenseRecord["category"] | "">(source?.category || "");
  const [vendorName, setVendorName] = useState(source?.vendorName || "");
  const [vendorGstin, setVendorGstin] = useState(source?.vendorGstin || "");
  const [vendorStateCode, setVendorStateCode] = useState(source?.vendorStateCode || SELLER.stateCode);
  const [billNumber, setBillNumber] = useState(source?.billNumber || "");
  const [description, setDescription] = useState(source?.description || "");
  // Kept as text while typing so a half-typed number is not rewritten
  const [taxableValue, setTaxableValue] = useState(source ? String(source.taxableValue) : "");
  const [gstRate, setGstRate] = useState(source ? String(source.gstRate) : "0");
  const [itcEligible, setItcEligible] = useState(source?.itcEligible || false);
  const [paymentMode, setPaymentMode] = useState<ExpenseRecord["paymentMode"]>(source?.paymentMode || "UPI");
  const [paymentStatus, setPaymentStatus] = useState<ExpenseRecord["paymentStatus"]>(source?.paymentStatus || "PAID");
  const [recurring, setRecurring] = useState<ExpenseRecord["recurring"]>(source?.recurring || "NONE");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const amounts = useMemo(
    () =>
      computeExpense({
        taxableValue: parseFloat(taxableValue) || 0,
        gstRate: parseFloat(gstRate) || 0,
        vendorStateCode,
        ourStateCode: SELLER.stateCode,
      }),
    [taxableValue, gstRate, vendorStateCode]
  );

  /** Picking a known vendor fills in what was used for them last time. */
  const changeVendorName = (name: string) => {
    setVendorName(name);
    const known = vendors.find((v) => v.vendorName.toLowerCase() === name.trim().toLowerCase());
    if (!known) return;
    setVendorGstin(known.vendorGstin || "");
    if (known.vendorStateCode) setVendorStateCode(known.vendorStateCode);
    if (known.category) setCategory(known.category);
    if (known.brand) setBrand(known.brand);
    if (known.recurring) setRecurring(known.recurring);
    if (typeof known.gstRate === "number") {
      setGstRate(String(known.gstRate));
      setItcEligible(!!known.vendorGstin && known.gstRate > 0);
    }
  };

  const changeGstin = (raw: string) => {
    const gstin = raw.toUpperCase().replace(/\s/g, "");
    setVendorGstin(gstin);
    // The first two digits of a GSTIN are the state code
    const prefix = gstin.slice(0, 2);
    if (INDIAN_STATES.some((s) => s.code === prefix)) setVendorStateCode(prefix);
    if (!gstin) {
      setGstRate("0");
      setItcEligible(false);
    }
  };

  const changeGstRate = (rate: string) => {
    setGstRate(rate);
    // GST on a registered vendor's bill is normally claimable, so default to yes
    setItcEligible(!!vendorGstin && parseFloat(rate) > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        expenseDate,
        brand,
        category,
        vendorName,
        vendorGstin,
        vendorStateCode,
        billNumber,
        description,
        taxableValue: parseFloat(taxableValue) || 0,
        gstRate: parseFloat(gstRate) || 0,
        itcEligible,
        paymentMode,
        paymentStatus,
        recurring,
      };
      if (source) await axios.patch(`/api/v1/expenses/${source._id}`, payload);
      else await axios.post("/api/v1/expenses", payload);
      onSaved();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const gstDisabled = !vendorGstin;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="expense-form-title"
      onClose={onClose}
      className="m-auto w-[min(96vw,44rem)] max-h-[94vh] rounded-3xl border border-input bg-card p-0 shadow-2xl backdrop:bg-foreground/50"
    >
      <form onSubmit={handleSubmit}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-card">
          <div>
            <h2 id="expense-form-title" className="text-lg font-semibold text-foreground">
              {source ? "Edit Expense" : "Add Expense"}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              Supplier bills, subscriptions and any other business spend
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-muted-foreground hover:bg-border hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-destructive-soft border border-border text-sm font-semibold text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="exp-vendor">Vendor / Paid To *</label>
              <input
                id="exp-vendor"
                list="expense-vendors"
                required
                autoFocus
                autoComplete="off"
                className={`${inputClass} ${invalidClass}`}
                value={vendorName}
                onChange={(e) => changeVendorName(e.target.value)}
                placeholder="Supplier or company name"
              />
              <datalist id="expense-vendors">
                {vendors.map((v) => (
                  <option key={v.vendorName} value={v.vendorName} />
                ))}
              </datalist>
              <p className={fieldErrorClass}>Error: enter who was paid.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-category">Category *</label>
              <select
                id="exp-category"
                required
                className={`${inputClass} ${invalidClass} cursor-pointer`}
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseRecord["category"])}
              >
                <option value="">Choose a category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className={fieldErrorClass}>Error: choose a category.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-date">Bill Date *</label>
              <input
                id="exp-date"
                type="date"
                required
                max={todayIso()}
                className={`${inputClass} ${invalidClass}`}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
              <p className={fieldErrorClass}>Error: enter a bill date that is not in the future.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-bill">Bill / Invoice No.</label>
              <input
                id="exp-bill"
                className={inputClass}
                value={billNumber}
                maxLength={60}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="As printed on the bill"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-brand">For Which Brand</label>
              <select
                id="exp-brand"
                className={`${inputClass} cursor-pointer`}
                value={brand}
                onChange={(e) => setBrand(e.target.value as ExpenseRecord["brand"])}
              >
                {EXPENSE_BRANDS.map((b) => (
                  <option key={b} value={b}>
                    {EXPENSE_BRAND_LABELS[b]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-recurring">Type</label>
              <select
                id="exp-recurring"
                className={`${inputClass} cursor-pointer`}
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as ExpenseRecord["recurring"])}
              >
                {RECURRING_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {RECURRING_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="exp-desc">What Was It For</label>
              <input
                id="exp-desc"
                className={inputClass}
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 30 hamper boxes for Diwali orders"
              />
            </div>
          </div>

          <fieldset className="rounded-2xl border border-border p-4 space-y-3">
            <legend className="px-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Amount & GST
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="exp-gstin">Vendor GSTIN (if on the bill)</label>
                <input
                  id="exp-gstin"
                  className={`${inputClass} ${invalidClass}`}
                  value={vendorGstin}
                  maxLength={15}
                  pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
                  onChange={(e) => changeGstin(e.target.value)}
                  placeholder="27ABCDE1234F1Z5"
                />
                <p className={fieldErrorClass}>Error: a GSTIN has 15 characters in the format 27ABCDE1234F1Z5.</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="exp-state">Vendor State *</label>
                <select
                  id="exp-state"
                  className={`${inputClass} cursor-pointer`}
                  value={vendorStateCode}
                  onChange={(e) => setVendorStateCode(e.target.value)}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="exp-amount">Amount Before GST (₹) *</label>
                <input
                  id="exp-amount"
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  className={`${inputClass} ${invalidClass}`}
                  value={taxableValue}
                  onChange={(e) => setTaxableValue(e.target.value)}
                  placeholder="0.00"
                />
                <p className={fieldErrorClass}>Error: enter an amount more than 0.</p>
              </div>
              <div>
                <label className={labelClass} htmlFor="exp-rate">GST Charged</label>
                <select
                  id="exp-rate"
                  disabled={gstDisabled}
                  className={`${inputClass} cursor-pointer disabled:bg-muted disabled:text-muted-foreground`}
                  value={gstRate}
                  onChange={(e) => changeGstRate(e.target.value)}
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate} value={rate}>
                      {rate === 0 ? "No GST (0%)" : `${rate}%`}
                    </option>
                  ))}
                </select>
                {gstDisabled && (
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    Enter the vendor&apos;s GSTIN to record GST on this bill.
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-slate-900"
                checked={itcEligible}
                disabled={gstDisabled || parseFloat(gstRate) === 0}
                onChange={(e) => setItcEligible(e.target.checked)}
              />
              <span>
                Claim this GST as input credit
                <span className="block text-xs text-muted-foreground">
                  Untick for personal use, food, or anything GST credit is not allowed on.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-end justify-between gap-3 pt-3 border-t border-border">
              <div className="text-sm font-medium text-muted-foreground space-y-0.5">
                {amounts.isInterState ? (
                  <p>IGST: ₹{formatINR(amounts.igst)}</p>
                ) : (
                  <p>
                    CGST: ₹{formatINR(amounts.cgst)} · SGST: ₹{formatINR(amounts.sgst)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {amounts.isInterState
                    ? "Vendor is outside Maharashtra, so the bill carries IGST."
                    : "Vendor is in Maharashtra, so the bill carries CGST + SGST."}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bill Total</p>
                <p className="text-2xl font-bold text-foreground">₹{formatINR(amounts.total)}</p>
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="exp-mode">Paid By</label>
              <select
                id="exp-mode"
                className={`${inputClass} cursor-pointer`}
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as ExpenseRecord["paymentMode"])}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="exp-status">Payment Status</label>
              <select
                id="exp-status"
                className={`${inputClass} cursor-pointer`}
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as ExpenseRecord["paymentStatus"])}
              >
                <option value="PAID">Paid</option>
                <option value="UNPAID">Not paid yet</option>
              </select>
            </div>
          </div>

        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-border rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {source ? "Save Changes" : "Save Expense"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
