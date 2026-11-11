"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Plus,
  Search,
  Settings,
  FileDown,
  FileText,
  Pencil,
  Copy,
  Trash2,
  Ban,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/invoice/calc";
import { BRAND_CONFIG, INVOICE_BRANDS, formatInvoiceDate } from "@/lib/invoice/config";
import { InvoiceEditor } from "./InvoiceEditor";
import { InvoiceSettingsModal } from "./InvoiceSettingsModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { InvoiceRecord, InvoiceSettingsForm, SavedCustomer, CatalogItem } from "./types";

type Status = InvoiceRecord["status"];

const STATUS_STYLES: Record<Status, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-700",
};

const STATUS_LABELS: Record<Status, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  CANCELLED: "Cancelled",
};

const STATUS_TABS: { value: "all" | Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ISSUED", label: "Issued" },
  { value: "DRAFT", label: "Drafts" },
  { value: "CANCELLED", label: "Cancelled" },
];

function downloadUrl(id: string, format: "pdf" | "docx") {
  return `/api/v1/invoices/${id}/download?format=${format}`;
}

const iconButton =
  "p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer";
const dangerIconButton =
  "p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer";
const downloadButton =
  "flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 rounded-lg border border-slate-300 hover:bg-slate-100";

export default function InvoiceCenter() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [settings, setSettings] = useState<InvoiceSettingsForm | null>(null);
  const [customers, setCustomers] = useState<SavedCustomer[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  const [brand, setBrand] = useState("all");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: "new" | "edit"; source: InvoiceRecord | null } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [justIssued, setJustIssued] = useState<InvoiceRecord | null>(null);
  const [confirm, setConfirm] = useState<{ kind: "delete" | "cancel"; invoice: InvoiceRecord } | null>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      // Status is filtered in the browser so the summary cards always cover every status
      const res = await axios.get("/api/v1/invoices", { params: { brand, search } });
      setInvoices(res.data.invoices || []);
      setError(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load invoices.");
    } finally {
      setIsLoading(false);
    }
  }, [brand, search]);

  const fetchSuggestions = useCallback(
    () =>
      axios
        .get("/api/v1/invoices/suggest")
        .then((res) => {
          setCustomers(res.data.customers || []);
          setCatalog(res.data.items || []);
        })
        // Suggestions are a convenience; the form works without them
        .catch(() => {}),
    []
  );

  // Debounced so typing in the search box does not fire a request per keystroke
  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 250);
    return () => clearTimeout(timer);
  }, [fetchInvoices]);

  useEffect(() => {
    fetchSuggestions();
    axios
      .get("/api/v1/invoices/settings")
      .then((res) => setSettings(res.data.settings))
      .catch(() => setError("Failed to load invoice settings."));
  }, [fetchSuggestions]);

  const stats = useMemo(() => {
    const issued = invoices.filter((i) => i.status === "ISSUED");
    return {
      issuedValue: issued.reduce((sum, i) => sum + (i.totals?.grandTotal || 0), 0),
      issuedCount: issued.length,
      draftCount: invoices.filter((i) => i.status === "DRAFT").length,
      cancelledCount: invoices.filter((i) => i.status === "CANCELLED").length,
    };
  }, [invoices]);

  const counts: Record<"all" | Status, number> = {
    all: invoices.length,
    ISSUED: stats.issuedCount,
    DRAFT: stats.draftCount,
    CANCELLED: stats.cancelledCount,
  };

  const visible = status === "all" ? invoices : invoices.filter((i) => i.status === status);

  /** Loads the full invoice (the list only carries summary fields) and opens the editor. */
  const openEditor = async (invoice: InvoiceRecord, mode: "new" | "edit") => {
    setBusyId(invoice._id);
    try {
      const res = await axios.get(`/api/v1/invoices/${invoice._id}`);
      setEditor({ mode, source: res.data.invoice });
    } catch {
      setError("Failed to open invoice.");
    } finally {
      setBusyId(null);
    }
  };

  const runConfirmed = async (reason: string) => {
    if (!confirm) return;
    const { kind, invoice } = confirm;
    setConfirm(null);
    setBusyId(invoice._id);
    try {
      if (kind === "delete") {
        await axios.delete(`/api/v1/invoices/${invoice._id}`);
      } else {
        await axios.patch(`/api/v1/invoices/${invoice._id}`, { action: "cancel", reason });
      }
      await fetchInvoices();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "That action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (invoice: InvoiceRecord) => {
    setEditor(null);
    setJustIssued(invoice.status === "ISSUED" ? invoice : null);
    fetchInvoices();
    fetchSuggestions();
  };

  const renderActions = (invoice: InvoiceRecord) => (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {busyId === invoice._id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      <a href={downloadUrl(invoice._id, "pdf")} title="Download PDF" className={downloadButton}>
        <FileDown className="w-3.5 h-3.5" /> PDF
      </a>
      <a href={downloadUrl(invoice._id, "docx")} title="Download Word document" className={downloadButton}>
        <FileDown className="w-3.5 h-3.5" /> DOCX
      </a>
      {invoice.status === "DRAFT" && (
        <button onClick={() => openEditor(invoice, "edit")} title="Edit draft" aria-label="Edit draft" className={iconButton}>
          <Pencil className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={() => openEditor(invoice, "new")}
        title="Duplicate as new invoice"
        aria-label="Duplicate as new invoice"
        className={iconButton}
      >
        <Copy className="w-4 h-4" />
      </button>
      {invoice.status === "DRAFT" && (
        <button
          onClick={() => setConfirm({ kind: "delete", invoice })}
          title="Delete draft"
          aria-label="Delete draft"
          className={dangerIconButton}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {invoice.status === "ISSUED" && (
        <button
          onClick={() => setConfirm({ kind: "cancel", invoice })}
          title="Cancel invoice"
          aria-label="Cancel invoice"
          className={dangerIconButton}
        >
          <Ban className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const statusBadge = (value: Status) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_STYLES[value]}`}>
      {STATUS_LABELS[value]}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Total invoiced</p>
          <p className="mt-1 text-2xl font-black text-slate-900">₹{formatINR(stats.issuedValue)}</p>
          <p className="text-[11px] font-semibold text-slate-500">
            Across {stats.issuedCount} issued invoice{stats.issuedCount === 1 ? "" : "s"}
            {brand !== "all" ? ` for ${BRAND_CONFIG[brand as keyof typeof BRAND_CONFIG]?.name}` : ""}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Drafts</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.draftCount}</p>
          <p className="text-[11px] font-semibold text-slate-500">Waiting to be issued</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Cancelled</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.cancelledCount}</p>
          <p className="text-[11px] font-semibold text-slate-500">Numbers stay used</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer or phone"
            aria-label="Search invoices"
            className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none focus:border-slate-800"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter by brand"
          className="px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none cursor-pointer"
        >
          <option value="all">All brands</option>
          {INVOICE_BRANDS.map((slug) => (
            <option key={slug} value={slug}>
              {BRAND_CONFIG[slug].name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 lg:ml-auto">
          <button
            onClick={() => setShowSettings(true)}
            disabled={!settings}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={() => setEditor({ mode: "new", source: null })}
            disabled={!settings}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar" role="group" aria-label="Filter by status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            aria-pressed={status === tab.value}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
              status === tab.value
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 rounded-full text-[10px] ${
                status === tab.value ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      {justIssued && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Invoice <span className="font-bold">{justIssued.invoiceNumber}</span> issued for{" "}
            {justIssued.customer.name}.
          </span>
          <a href={downloadUrl(justIssued._id, "pdf")} className="font-bold underline">
            Download PDF
          </a>
          <a href={downloadUrl(justIssued._id, "docx")} className="font-bold underline">
            Download DOCX
          </a>
          <button
            onClick={() => setJustIssued(null)}
            aria-label="Dismiss"
            className="ml-auto p-1 rounded-lg hover:bg-emerald-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-16 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading invoices...
        </div>
      ) : visible.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-white rounded-2xl border border-slate-200">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-900">No invoices found</p>
          <p className="text-xs font-semibold text-slate-500">
            {search || brand !== "all" || status !== "all"
              ? "Try clearing the search or filters."
              : "Create the first invoice with the New Invoice button."}
          </p>
        </div>
      ) : (
        <>
          {/* Phones and small tablets: one card per invoice */}
          <ul className="md:hidden space-y-2.5">
            {visible.map((invoice) => (
              <li key={invoice._id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{invoice.customer?.name}</p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {invoice.invoiceNumber || "Not numbered"} · {formatInvoiceDate(invoice.invoiceDate)}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">{BRAND_CONFIG[invoice.brand]?.name}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5">
                    <p className="text-sm font-black text-slate-900">₹{formatINR(invoice.totals?.grandTotal || 0)}</p>
                    {statusBadge(invoice.status)}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">{renderActions(invoice)}</div>
              </li>
            ))}
          </ul>

          {/* Wider screens: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] font-extrabold tracking-wider text-slate-400 uppercase border-b border-slate-200 bg-slate-50/60">
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Brand</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr key={invoice._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                      {invoice.invoiceNumber || <span className="text-slate-400">Not numbered</span>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                      {formatInvoiceDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-[240px] truncate">
                      {invoice.customer?.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">
                      {BRAND_CONFIG[invoice.brand]?.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 text-right whitespace-nowrap">
                      ₹{formatINR(invoice.totals?.grandTotal || 0)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(invoice.status)}</td>
                    <td className="px-4 py-3">{renderActions(invoice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editor && settings && (
        <InvoiceEditor
          key={editor.source?._id || "new"}
          mode={editor.mode}
          source={editor.source}
          settings={settings}
          customers={customers}
          catalog={catalog}
          onClose={() => setEditor(null)}
          onSaved={handleSaved}
        />
      )}

      {showSettings && settings && (
        <InvoiceSettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSaved={setSettings}
        />
      )}

      {confirm?.kind === "delete" && (
        <ConfirmDialog
          title="Delete this draft?"
          message={`The draft for ${confirm.invoice.customer.name} will be removed. It has no invoice number, so nothing else is affected.`}
          confirmLabel="Delete draft"
          cancelLabel="Keep draft"
          onConfirm={runConfirmed}
          onClose={() => setConfirm(null)}
        />
      )}

      {confirm?.kind === "cancel" && (
        <ConfirmDialog
          title={`Cancel invoice ${confirm.invoice.invoiceNumber}?`}
          message="It will be marked CANCELLED and stay on record. Its number is not reused, and this cannot be undone."
          confirmLabel="Cancel invoice"
          cancelLabel="Keep invoice"
          reasonLabel="Reason (optional)"
          onConfirm={runConfirmed}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
