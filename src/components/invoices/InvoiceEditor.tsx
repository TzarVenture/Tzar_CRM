"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { X, Plus, Trash2, Loader2, Save, FileCheck2, Eye } from "lucide-react";
import { computeInvoice, formatINR } from "@/lib/invoice/calc";
import {
  SELLER,
  BRAND_CONFIG,
  INVOICE_BRANDS,
  INDIAN_STATES,
  GST_RATES,
  UNITS,
  InvoiceBrand,
  toIsoDate,
} from "@/lib/invoice/config";
import {
  InvoiceRecord,
  InvoiceSettingsForm,
  InvoiceCustomerForm,
  SavedCustomer,
  CatalogItem,
  inputClass,
  labelClass,
} from "./types";

// Numeric fields stay as strings while typing so "1." or an empty box is not rewritten mid-edit
interface ItemRow {
  key: number;
  description: string;
  details: string;
  hsnSac: string;
  quantity: string;
  unit: string;
  rate: string;
  discountPercent: string;
  gstRate: string;
}

interface InvoiceEditorProps {
  /** Draft being edited, or an invoice being duplicated. Null for a blank invoice. */
  source: InvoiceRecord | null;
  mode: "new" | "edit";
  settings: InvoiceSettingsForm;
  customers: SavedCustomer[];
  catalog: CatalogItem[];
  onClose: () => void;
  onSaved: (invoice: InvoiceRecord) => void;
}

let rowKey = 0;

function blankRow(brand: InvoiceBrand): ItemRow {
  const cfg = BRAND_CONFIG[brand];
  return {
    key: ++rowKey,
    description: "",
    details: "",
    hsnSac: cfg.defaultHsnSac,
    quantity: "1",
    unit: cfg.defaultUnit,
    rate: "",
    discountPercent: "",
    gstRate: String(cfg.defaultGstRate),
  };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const DUE_PRESETS = [
  { label: "On receipt", days: 0 },
  { label: "7 days", days: 7 },
  { label: "15 days", days: 15 },
  { label: "30 days", days: 30 },
];

const invalidClass = "peer user-invalid:border-rose-500 user-invalid:bg-rose-50";
const fieldErrorClass = "hidden peer-user-invalid:block mt-1 text-[11px] font-semibold text-rose-600";

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

const EMPTY_CUSTOMER: InvoiceCustomerForm = {
  name: "",
  gstin: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  stateCode: SELLER.stateCode,
  pincode: "",
};

export function InvoiceEditor({
  source,
  mode,
  settings,
  customers,
  catalog,
  onClose,
  onSaved,
}: InvoiceEditorProps) {
  const [brand, setBrand] = useState<InvoiceBrand>(source?.brand || "tzar");
  // A duplicate is a new invoice, so it gets today's date rather than the old one
  const [invoiceDate, setInvoiceDate] = useState(
    mode === "edit" && source ? toIsoDate(source.invoiceDate) : todayIso()
  );
  const [dueDate, setDueDate] = useState(mode === "edit" && source ? toIsoDate(source.dueDate) : "");
  const [customer, setCustomer] = useState<InvoiceCustomerForm>({
    ...EMPTY_CUSTOMER,
    ...(source?.customer || {}),
  });
  // Empty means "same as the customer state"; set only when delivery is in a different state
  const [placeOfSupplyOverride, setPlaceOfSupplyOverride] = useState(
    source?.placeOfSupplyCode && source.placeOfSupplyCode !== source.customer.stateCode
      ? source.placeOfSupplyCode
      : ""
  );
  const placeOfSupplyCode = placeOfSupplyOverride || customer.stateCode;
  const [items, setItems] = useState<ItemRow[]>(
    source?.items?.length
      ? source.items.map((item) => ({
          key: ++rowKey,
          description: item.description,
          details: item.details || "",
          hsnSac: item.hsnSac || "",
          quantity: String(item.quantity),
          unit: item.unit || "",
          rate: String(item.rate),
          discountPercent: item.discountPercent ? String(item.discountPercent) : "",
          gstRate: String(item.gstRate),
        }))
      : [blankRow(source?.brand || "tzar")]
  );
  const [pricesIncludeTax, setPricesIncludeTax] = useState(!!source?.pricesIncludeTax);
  const [notes, setNotes] = useState(source ? source.notes || "" : settings.defaultNotes);
  // Goods brands carry their own terms; the rest use the terms from Invoice Settings
  const termsFor = (b: InvoiceBrand) => BRAND_CONFIG[b].defaultTerms || settings.defaultTerms;
  const [terms, setTerms] = useState(source ? source.terms || "" : termsFor("tzar"));
  const [nextNumber, setNextNumber] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const summaryRef = useRef<HTMLElement>(null);

  // Shows the number this invoice would get if issued right now
  useEffect(() => {
    if (!invoiceDate) return;
    let active = true;
    axios
      .get("/api/v1/invoices/next-number", { params: { brand, date: invoiceDate } })
      .then((res) => active && setNextNumber(res.data.number || ""))
      .catch(() => active && setNextNumber(""));
    return () => {
      active = false;
    };
  }, [brand, invoiceDate]);

  const [saving, setSaving] = useState<"draft" | "issue" | null>(null);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandCatalog = useMemo(() => catalog.filter((c) => c.brand === brand), [catalog, brand]);

  const computed = useMemo(
    () =>
      computeInvoice({
        items: items.map((row) => ({
          description: row.description,
          quantity: parseFloat(row.quantity) || 0,
          rate: parseFloat(row.rate) || 0,
          discountPercent: parseFloat(row.discountPercent) || 0,
          gstRate: parseFloat(row.gstRate) || 0,
        })),
        pricesIncludeTax,
        sellerStateCode: SELLER.stateCode,
        customerStateCode: placeOfSupplyCode,
      }),
    [items, pricesIncludeTax, placeOfSupplyCode]
  );

  const changeBrand = (next: InvoiceBrand) => {
    // Untouched rows follow the new brand's defaults; rows already filled in are left alone
    setItems((rows) => rows.map((row) => (row.description || row.rate ? row : blankRow(next))));
    // Terms follow the brand too, unless they were edited by hand
    if (terms === termsFor(brand)) setTerms(termsFor(next));
    setBrand(next);
  };

  const changeCustomerName = (name: string) => {
    const saved = customers.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (saved) {
      setCustomer({
        name: saved.name,
        gstin: saved.gstin || "",
        phone: saved.phone || "",
        email: saved.email || "",
        address: saved.address || "",
        city: saved.city || "",
        stateCode: saved.stateCode || SELLER.stateCode,
        pincode: saved.pincode || "",
      });
    } else {
      setCustomer((prev) => ({ ...prev, name }));
    }
  };

  const changeGstin = (raw: string) => {
    const gstin = raw.toUpperCase().replace(/\s/g, "");
    const prefix = gstin.slice(0, 2);
    // The first two digits of a GSTIN are the state code
    const stateFromGstin = INDIAN_STATES.some((s) => s.code === prefix) ? prefix : null;
    setCustomer((prev) => ({ ...prev, gstin, stateCode: stateFromGstin || prev.stateCode }));
  };

  const updateRow = (key: number, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const changeDescription = (key: number, description: string) => {
    const saved = brandCatalog.find(
      (c) => c.description.toLowerCase() === description.trim().toLowerCase()
    );
    updateRow(
      key,
      saved
        ? {
            description: saved.description,
            hsnSac: saved.hsnSac || "",
            unit: saved.unit || "",
            rate: String(saved.rate),
            gstRate: String(saved.gstRate),
          }
        : { description }
    );
  };

  const buildPayload = (action: "draft" | "issue") => ({
    action,
    brand,
    invoiceDate,
    dueDate,
    customer,
    placeOfSupplyCode,
    pricesIncludeTax,
    notes,
    terms,
    items: items
      .filter((row) => row.description.trim())
      .map((row) => ({
        description: row.description,
        details: row.details,
        hsnSac: row.hsnSac,
        quantity: parseFloat(row.quantity) || 0,
        unit: row.unit,
        rate: parseFloat(row.rate) || 0,
        discountPercent: parseFloat(row.discountPercent) || 0,
        gstRate: parseFloat(row.gstRate) || 0,
      })),
  });

  /** Renders the unsaved form as a PDF in a new tab. Nothing is stored. */
  const preview = async () => {
    setError(null);
    setPreviewing(true);
    // Opened before the request so the browser treats it as a direct click, not a pop-up
    const tab = window.open("", "_blank");
    try {
      const res = await axios.post("/api/v1/invoices/preview", buildPayload("draft"), {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      tab?.close();
      let message = "Failed to build the preview.";
      try {
        message = JSON.parse(await err.response.data.text()).error || message;
      } catch {
        // Response was not JSON; keep the generic message
      }
      setError(message);
    } finally {
      setPreviewing(false);
    }
  };

  const save = async (action: "draft" | "issue") => {
    setError(null);
    setSaving(action);
    try {
      const payload = buildPayload(action);
      const res =
        mode === "edit" && source
          ? await axios.patch(`/api/v1/invoices/${source._id}`, payload)
          : await axios.post("/api/v1/invoices", payload);
      onSaved(res.data.invoice);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save invoice.");
      setConfirmIssue(false);
    } finally {
      setSaving(null);
    }
  };

  const t = computed.totals;

  // Portalled to <body>: the animated page wrapper has a transform, which would trap position:fixed inside it
  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-3.5 bg-white border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "edit" ? "Edit Draft Invoice" : "New Invoice"}
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Issued under {SELLER.tradeName} · GSTIN {SELLER.gstin}
          </p>
          {nextNumber && (
            <p className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              Next number: {nextNumber}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Brand + dates */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <div>
                <label className={labelClass}>Brand</label>
                <div className="flex flex-wrap gap-2">
                  {INVOICE_BRANDS.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => changeBrand(slug)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                        brand === slug
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {BRAND_CONFIG[slug].name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className={labelClass}>Invoice Date *</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Due Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={dueDate}
                    min={invoiceDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Payment due:</span>
                {DUE_PRESETS.map((preset) => {
                  const value = addDays(invoiceDate || todayIso(), preset.days);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setDueDate(value)}
                      aria-pressed={dueDate === value}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors cursor-pointer ${
                        dueDate === value
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Customer */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Bill To</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Customer / Company Name *</label>
                  <input
                    list="invoice-customers"
                    required
                    className={`${inputClass} ${invalidClass}`}
                    value={customer.name}
                    onChange={(e) => changeCustomerName(e.target.value)}
                    placeholder="Start typing to pick a saved customer"
                    autoComplete="off"
                  />
                  <datalist id="invoice-customers">
                    {customers.map((c) => (
                      <option key={c._id} value={c.name} />
                    ))}
                  </datalist>
                  <p className={fieldErrorClass}>Error: enter the customer or company name.</p>
                </div>
                <div>
                  <label className={labelClass}>GSTIN (leave blank if unregistered)</label>
                  <input
                    className={`${inputClass} ${invalidClass}`}
                    value={customer.gstin}
                    maxLength={15}
                    pattern="[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"
                    onChange={(e) => changeGstin(e.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                  />
                  <p className={fieldErrorClass}>
                    Error: a GSTIN has 15 characters in the format 27ABCDE1234F1Z5.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    className={inputClass}
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Billing Address</label>
                  <input
                    className={inputClass}
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Building, street, area"
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>State *</label>
                    <select
                      className={`${inputClass} cursor-pointer`}
                      value={customer.stateCode}
                      onChange={(e) => setCustomer({ ...customer, stateCode: e.target.value })}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>PIN Code</label>
                    <input
                      className={inputClass}
                      value={customer.pincode}
                      maxLength={6}
                      onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3 pt-1">
                <div className="w-full sm:w-64">
                  <label className={labelClass}>Place of Supply (where it is delivered)</label>
                  <select
                    className={`${inputClass} cursor-pointer`}
                    value={placeOfSupplyOverride}
                    onChange={(e) => setPlaceOfSupplyOverride(e.target.value)}
                  >
                    <option value="">Same as customer state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="pb-2 text-[11px] font-semibold text-slate-500">
                  {computed.isInterState
                    ? "Supply is outside Maharashtra, so IGST applies."
                    : "Supply is within Maharashtra, so CGST + SGST apply."}
                </p>
              </div>
            </section>

            {/* Items */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">Items</h3>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricesIncludeTax}
                    onChange={(e) => setPricesIncludeTax(e.target.checked)}
                    className="w-4 h-4 accent-slate-900"
                  />
                  Rates already include GST
                </label>
              </div>

              <datalist id="invoice-catalog">
                {brandCatalog.map((c) => (
                  <option key={c._id} value={c.description} />
                ))}
              </datalist>

              {items.map((row, index) => (
                <div key={row.key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 w-5 text-xs font-bold text-slate-400">{index + 1}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        list="invoice-catalog"
                        aria-label="Item description"
                        className={inputClass}
                        value={row.description}
                        onChange={(e) => changeDescription(row.key, e.target.value)}
                        placeholder="Product or service name *"
                        autoComplete="off"
                      />
                      <textarea
                        aria-label="Item details"
                        rows={1}
                        className={`${inputClass} min-h-[34px]`}
                        value={row.details}
                        onChange={(e) => updateRow(row.key, { details: e.target.value })}
                        placeholder="Extra details, one per line (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((rows) => rows.filter((r) => r.key !== row.key))}
                      disabled={items.length === 1}
                      aria-label="Remove item"
                      className="mt-1 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pl-7 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-end">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">HSN / SAC</label>
                      <input
                        className={inputClass}
                        value={row.hsnSac}
                        onChange={(e) => updateRow(row.key, { hsnSac: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={inputClass}
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unit</label>
                      <select
                        className={`${inputClass} cursor-pointer`}
                        value={row.unit}
                        onChange={(e) => updateRow(row.key, { unit: e.target.value })}
                      >
                        <option value="">-</option>
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className={inputClass}
                        value={row.rate}
                        onChange={(e) => updateRow(row.key, { rate: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Discount %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        className={inputClass}
                        value={row.discountPercent}
                        onChange={(e) => updateRow(row.key, { discountPercent: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">GST %</label>
                      <select
                        className={`${inputClass} cursor-pointer`}
                        value={row.gstRate}
                        onChange={(e) => updateRow(row.key, { gstRate: e.target.value })}
                      >
                        {GST_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 mb-0.5">Amount</p>
                      <p className="py-2 text-sm font-bold text-slate-900">
                        ₹{formatINR(computed.items[index]?.lineTotal || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setItems((rows) => [...rows, blankRow(brand)])}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 rounded-xl border border-dashed border-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add another item
              </button>
            </section>

            {/* Notes + terms */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Notes (shown on invoice)</label>
                <textarea rows={4} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Terms & Conditions</label>
                <textarea rows={4} className={inputClass} value={terms} onChange={(e) => setTerms(e.target.value)} />
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside ref={summaryRef} className="lg:sticky lg:top-0 h-fit space-y-4 pb-20 lg:pb-0">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">Summary</h3>
              <div className="space-y-1.5 text-xs font-semibold text-slate-600">
                {t.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount given</span>
                    <span>₹{formatINR(t.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Taxable value</span>
                  <span className="text-slate-900">₹{formatINR(t.taxableValue)}</span>
                </div>
                {computed.isInterState ? (
                  <div className="flex justify-between">
                    <span>IGST</span>
                    <span className="text-slate-900">₹{formatINR(t.igst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>CGST</span>
                      <span className="text-slate-900">₹{formatINR(t.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST</span>
                      <span className="text-slate-900">₹{formatINR(t.sgst)}</span>
                    </div>
                  </>
                )}
                {t.roundOff !== 0 && (
                  <div className="flex justify-between">
                    <span>Round off</span>
                    <span className="text-slate-900">
                      {t.roundOff > 0 ? "+" : "-"}
                      {formatINR(Math.abs(t.roundOff))}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-slate-900">₹{formatINR(t.grandTotal)}</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500">{computed.amountInWords}</p>
            </section>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            {confirmIssue ? (
              <section className="bg-amber-50 rounded-2xl border border-amber-300 p-4 space-y-3">
                <p className="text-xs font-bold text-amber-900">
                  Issuing gives this invoice the next {BRAND_CONFIG[brand].prefix} number and locks it. It
                  can&apos;t be edited or deleted afterwards, only cancelled.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => save("issue")}
                    disabled={!!saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                  >
                    {saving === "issue" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
                    Yes, issue invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmIssue(false)}
                    disabled={!!saving}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </section>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setConfirmIssue(true)}
                  disabled={!!saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4" /> Save & Issue Invoice
                </button>
                <button
                  type="button"
                  onClick={() => save("draft")}
                  disabled={!!saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-800 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-60 cursor-pointer"
                >
                  {saving === "draft" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={preview}
                  disabled={previewing || !!saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-slate-700 rounded-xl hover:bg-slate-200 disabled:opacity-60 cursor-pointer"
                >
                  {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Preview PDF (nothing is saved)
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Phones: the summary sits below the form, so keep the total and next step in reach */}
      <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</p>
          <p className="text-lg font-black text-slate-900 leading-tight">₹{formatINR(t.grandTotal)}</p>
        </div>
        <button
          type="button"
          onClick={() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-emerald-700 hover:bg-emerald-800 cursor-pointer"
        >
          Review & save
        </button>
      </div>
    </div>,
    document.body
  );
}
