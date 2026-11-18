"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { SpinnerGap as Loader2, Plus, MagnifyingGlass as Search, Trash as Trash2 } from "@phosphor-icons/react";
import type { CustomerSummary } from "@/lib/accounts/ledger";
import { RECEIPT_MODES } from "@/lib/accounts/config";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
import { formatInvoiceDate } from "@/lib/invoice/config";
import { Money, cardClass, errorMessage, selectClass, todayIso } from "./shared";

interface StatementLine {
  date: string;
  type: "INVOICE" | "PAYMENT";
  ref: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentId?: string;
}

interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  total: number;
  paid: number;
  outstanding: number;
}

export default function LedgerCenter() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerSummary | null>(null);
  const [statement, setStatement] = useState<StatementLine[]>([]);
  const [invoices, setInvoices] = useState<OpenInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<StatementLine | null>(null);

  const loadCustomers = useCallback(() => {
    return axios
      .get("/api/v1/accounts/ledger")
      .then((res) => {
        setCustomers(res.data.customers);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, "Could not load customers")))
      .finally(() => setLoading(false));
  }, []);

  const loadStatement = useCallback((key: string) => {
    return axios
      .get(`/api/v1/accounts/ledger?customer=${encodeURIComponent(key)}`)
      .then((res) => {
        setStatement(res.data.statement);
        setInvoices(res.data.invoices);
      })
      .catch((err) => setError(errorMessage(err, "Could not load statement")));
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const open = (c: CustomerSummary) => {
    setSelected(c);
    setStatement([]);
    setInvoices([]);
    void loadStatement(c.key);
  };

  const refresh = async () => {
    await loadCustomers();
    if (selected) await loadStatement(selected.key);
  };

  const deletePayment = async () => {
    const line = toDelete;
    setToDelete(null);
    if (!line?.paymentId) return;
    try {
      await axios.delete(`/api/v1/accounts/payments/${line.paymentId}`);
      await refresh();
    } catch (err) {
      setError(errorMessage(err, "Could not delete the payment"));
    }
  };

  const shown = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.gstin || "").includes(search.toUpperCase()));
  const totalDue = customers.reduce((s, c) => s + Math.max(c.balance, 0), 0);
  const current = selected ? customers.find((c) => c.key === selected.key) || selected : null;

  return (
    <div className="grid lg:grid-cols-[22rem_1fr] gap-4 items-start">
      <div className={`${cardClass} p-3`}>
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-base font-bold text-foreground">Customers</h2>
          <span className="text-sm text-muted-foreground">Due <Money value={totalDue} className="font-semibold text-foreground" /></span>
        </div>
        <div className="relative mt-2">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or GSTIN"
            aria-label="Search customers"
            className="w-full pl-9 pr-3 py-2.5 text-sm font-medium rounded-xl border border-input outline-none focus:border-primary"
          />
        </div>
        {loading ? (
          <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3">Customers appear here once you issue a tax invoice.</p>
        ) : (
          <ul className="mt-2 space-y-1 max-h-[60vh] overflow-y-auto">
            {shown.map((c) => (
              <li key={c.key}>
                <button
                  onClick={() => open(c)}
                  aria-current={selected?.key === c.key}
                  className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted ${selected?.key === c.key ? "bg-muted" : ""}`}
                >
                  <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{c.invoiceCount} invoice{c.invoiceCount === 1 ? "" : "s"}</span>
                    <span className={c.balance > 0 ? "font-semibold text-destructive" : "text-success font-semibold"}>
                      {c.balance > 0 ? <Money value={c.balance} /> : "Settled"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`${cardClass} p-4 min-h-48`}>
        {error && <div className="mb-3 p-3 text-sm font-semibold text-destructive bg-destructive-soft border border-border rounded-xl">{error}</div>}
        {!current ? (
          <p className="text-sm text-muted-foreground">Choose a customer to see their statement.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">{current.name}</h2>
                {current.gstin && <p className="text-sm text-muted-foreground">GSTIN {current.gstin}</p>}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                Invoiced <Money value={current.invoiced} className="font-semibold text-foreground" /> · Received{" "}
                <Money value={current.received} className="font-semibold text-foreground" />
                <div className="text-base font-bold text-foreground">Balance <Money value={current.balance} /></div>
              </div>
            </div>

            <PaymentForm invoices={invoices.filter((i) => i.outstanding > 0)} onSaved={refresh} />

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 font-semibold">Details</th>
                    <th className="py-2 font-semibold text-right">Debit</th>
                    <th className="py-2 font-semibold text-right">Credit</th>
                    <th className="py-2 font-semibold text-right">Balance</th>
                    <th className="py-2 w-10"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {statement.map((l, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-2 whitespace-nowrap">{formatInvoiceDate(l.date)}</td>
                      <td className="py-2">
                        <div className="font-semibold text-foreground">{l.type === "INVOICE" ? l.ref : "Payment received"}</div>
                        <div className="text-muted-foreground">{l.description}</div>
                      </td>
                      <td className="py-2 text-right tabular-nums">{l.debit ? <Money value={l.debit} /> : ""}</td>
                      <td className="py-2 text-right tabular-nums text-success">{l.credit ? <Money value={l.credit} /> : ""}</td>
                      <td className="py-2 text-right tabular-nums font-semibold"><Money value={l.balance} /></td>
                      <td className="py-2 text-right">
                        {l.paymentId && (
                          <button onClick={() => setToDelete(l)} aria-label="Delete this payment" title="Delete this payment" className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {toDelete && (
        <ConfirmDialog
          title="Delete this payment?"
          message={`₹${toDelete.credit.toFixed(2)} received on ${formatInvoiceDate(toDelete.date)}. The invoice balance goes back up. This cannot be undone.`}
          confirmLabel="Delete payment"
          cancelLabel="Keep payment"
          onConfirm={deletePayment}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function PaymentForm({ invoices, onSaved }: { invoices: OpenInvoice[]; onSaved: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [mode, setMode] = useState<(typeof RECEIPT_MODES)[number]>("UPI");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (invoices.length === 0) return null;

  const chosen = invoices.find((i) => i.id === invoiceId);

  const pick = (id: string) => {
    setInvoiceId(id);
    const inv = invoices.find((i) => i.id === id);
    setAmount(inv ? String(inv.outstanding) : "");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await axios.post("/api/v1/accounts/payments", { invoiceId, date, amount: Number(amount), mode, reference });
      setOpen(false);
      setInvoiceId("");
      setAmount("");
      setReference("");
      await onSaved();
    } catch (err) {
      setError(errorMessage(err, "Could not save the payment"));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); pick(invoices[0].id); }}
        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Record payment received
      </button>
    );
  }

  return (
    <form onSubmit={save} className="mt-3 p-3 rounded-xl border border-border bg-muted grid sm:grid-cols-2 gap-3">
      <label className="text-sm font-semibold text-foreground sm:col-span-2">
        Against invoice
        <select value={invoiceId} onChange={(e) => pick(e.target.value)} className={`${selectClass} w-full mt-1`} required>
          {invoices.map((i) => (
            <option key={i.id} value={i.id}>{i.invoiceNumber} · due ₹{i.outstanding.toFixed(2)}</option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-foreground">
        Amount received (₹)
        <input type="number" step="0.01" min="0.01" max={chosen?.outstanding} required value={amount} onChange={(e) => setAmount(e.target.value)} className={`${selectClass} w-full mt-1`} />
      </label>
      <label className="text-sm font-semibold text-foreground">
        Date
        <input type="date" required max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} className={`${selectClass} w-full mt-1`} />
      </label>
      <label className="text-sm font-semibold text-foreground">
        Mode
        <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className={`${selectClass} w-full mt-1`}>
          {RECEIPT_MODES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <label className="text-sm font-semibold text-foreground">
        Reference (UTR / cheque no.)
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} className={`${selectClass} w-full mt-1`} />
      </label>
      {error && <p className="sm:col-span-2 text-sm font-semibold text-destructive">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover disabled:opacity-60 cursor-pointer">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save payment
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-foreground rounded-xl border border-input hover:bg-card cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}
