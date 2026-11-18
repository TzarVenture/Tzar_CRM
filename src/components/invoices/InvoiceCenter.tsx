"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, MagnifyingGlass as Search, Gear as Settings, FileArrowDown as FileDown, FileText, Pencil, Copy, Trash as Trash2, Prohibit as Ban, SpinnerGap as Loader2, CheckCircle as CheckCircle2, X } from "@phosphor-icons/react";
import { formatINR } from "@/lib/invoice/calc";
import { BRAND_CONFIG, INVOICE_BRANDS, formatInvoiceDate } from "@/lib/invoice/config";
import { InvoiceEditor } from "./InvoiceEditor";
import { InvoiceSettingsModal } from "./InvoiceSettingsModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { InvoiceRecord, InvoiceSettingsForm, SavedCustomer, CatalogItem } from "./types";

type Status = InvoiceRecord["status"];

const STATUS_STYLES: Record<Status, string> = {
  DRAFT: "bg-muted text-foreground",
  ISSUED: "bg-success-soft text-success",
  CANCELLED: "bg-destructive-soft text-destructive",
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

function downloadUrl(id: string) {
  return `/api/v1/invoices/${id}/download`;
}

const iconButton =
  "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer";
const dangerIconButton =
  "p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive-soft cursor-pointer";
const downloadButton =
  "flex items-center gap-1 px-2.5 py-1.5 text-sm font-semibold text-foreground rounded-lg border border-input hover:bg-muted";

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
    // A proforma is a quote, not a sale, so it never counts towards the invoiced total
    const issued = invoices.filter((i) => i.status === "ISSUED" && i.documentType !== "PROFORMA");
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
      {busyId === invoice._id && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      <a href={downloadUrl(invoice._id)} title="Download PDF" className={downloadButton}>
        <FileDown className="w-3.5 h-3.5" /> PDF
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

  const statusBadge = (invoice: InvoiceRecord) => (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[invoice.status]}`}
      >
        {STATUS_LABELS[invoice.status]}
      </span>
      {invoice.documentType === "PROFORMA" && (
        <span className="px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-muted text-foreground">
          Proforma
        </span>
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="col-span-2 bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total invoiced</p>
          <p className="mt-1 text-2xl font-bold text-foreground">₹{formatINR(stats.issuedValue)}</p>
          <p className="text-xs font-medium text-muted-foreground">
            Across {stats.issuedCount} issued tax invoice{stats.issuedCount === 1 ? "" : "s"}
            {brand !== "all" ? ` for ${BRAND_CONFIG[brand as keyof typeof BRAND_CONFIG]?.name}` : ""}
          </p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Drafts</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.draftCount}</p>
          <p className="text-xs font-medium text-muted-foreground">Waiting to be issued</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Cancelled</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.cancelledCount}</p>
          <p className="text-xs font-medium text-muted-foreground">Numbers stay used</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer or phone"
            aria-label="Search invoices"
            className="w-full pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border border-input bg-card outline-none focus:border-primary"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          aria-label="Filter by brand"
          className="px-3 py-2.5 text-sm font-medium rounded-xl border border-input bg-card outline-none cursor-pointer"
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
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground rounded-xl border border-input bg-card hover:bg-muted disabled:opacity-50 cursor-pointer"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={() => setEditor({ mode: "new", source: null })}
            disabled={!settings}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
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
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full border whitespace-nowrap transition-colors cursor-pointer ${
              status === tab.value
                ? "bg-primary text-white border-ring"
                : "bg-card text-muted-foreground border-input hover:bg-muted"
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 rounded-full text-xs ${
                status === tab.value ? "bg-card" : "bg-muted text-muted-foreground"
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
          className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-success-soft border border-border text-sm font-medium text-success"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Invoice <span className="font-semibold">{justIssued.invoiceNumber}</span> issued for{" "}
            {justIssued.customer.name}.
          </span>
          <a href={downloadUrl(justIssued._id)} className="font-semibold underline">
            Download PDF
          </a>
          <button
            onClick={() => setJustIssued(null)}
            aria-label="Dismiss"
            className="ml-auto p-1 rounded-lg hover:bg-success-soft cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-destructive-soft border border-border text-sm font-semibold text-destructive">
          {error}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 p-16 bg-card rounded-2xl border border-border text-sm font-medium text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading invoices...
        </div>
      ) : visible.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-card rounded-2xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-base font-semibold text-foreground">No invoices found</p>
          <p className="text-sm font-medium text-muted-foreground">
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
              <li key={invoice._id} className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">{invoice.customer?.name}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {invoice.invoiceNumber || "Not numbered"} · {formatInvoiceDate(invoice.invoiceDate)}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">{BRAND_CONFIG[invoice.brand]?.name}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5">
                    <p className="text-base font-bold text-foreground">₹{formatINR(invoice.totals?.grandTotal || 0)}</p>
                    {statusBadge(invoice)}
                  </div>
                </div>
                <div className="pt-3 border-t border-border">{renderActions(invoice)}</div>
              </li>
            ))}
          </ul>

          {/* Wider screens: table */}
          <div className="hidden md:block bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-wider text-muted-foreground uppercase border-b border-border bg-muted">
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
                  <tr key={invoice._id} className="border-b border-border last:border-0 hover:bg-muted">
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      {invoice.invoiceNumber || <span className="text-muted-foreground">Not numbered</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {formatInvoiceDate(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground max-w-[240px] truncate">
                      {invoice.customer?.name}
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                      {BRAND_CONFIG[invoice.brand]?.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground text-right whitespace-nowrap">
                      ₹{formatINR(invoice.totals?.grandTotal || 0)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(invoice)}</td>
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
