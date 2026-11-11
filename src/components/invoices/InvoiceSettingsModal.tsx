"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { X, Landmark, Loader2, Save } from "lucide-react";
import { SELLER } from "@/lib/invoice/config";
import { InvoiceSettingsForm, inputClass, labelClass } from "./types";

interface InvoiceSettingsModalProps {
  settings: InvoiceSettingsForm;
  onClose: () => void;
  onSaved: (settings: InvoiceSettingsForm) => void;
}

export function InvoiceSettingsModal({ settings, onClose, onSaved }: InvoiceSettingsModalProps) {
  const [form, setForm] = useState<InvoiceSettingsForm>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setBank = (key: keyof InvoiceSettingsForm["bank"], value: string) =>
    setForm((prev) => ({ ...prev, bank: { ...prev.bank, [key]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const res = await axios.put("/api/v1/invoices/settings", form);
      onSaved(res.data.settings);
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save invoice settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Portalled to <body>: the animated page wrapper has a transform, which would trap position:fixed inside it
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl border border-slate-300 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Invoice Settings</h2>
              <p className="text-xs font-semibold text-slate-500">
                Printed on every new invoice. Issued invoices keep the details they were issued with.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="font-bold text-slate-900">{SELLER.tradeName}</span> (Proprietor: {SELLER.legalName})
            <br />
            GSTIN {SELLER.gstin} · {SELLER.addressLines.join(", ")}
            <br />
            <span className="text-slate-500">These come from the GST certificate and are fixed.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input
                className={inputClass}
                value={form.sellerPhone}
                onChange={(e) => setForm({ ...form, sellerPhone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input
                type="email"
                className={inputClass}
                value={form.sellerEmail}
                onChange={(e) => setForm({ ...form, sellerEmail: e.target.value })}
                placeholder="accounts@company.com"
              />
            </div>
            <div>
              <label className={labelClass}>Authorised Signatory</label>
              <input
                className={inputClass}
                value={form.signatoryName}
                onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-2">
              Bank Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Account Name</label>
                <input className={inputClass} value={form.bank.accountName} onChange={(e) => setBank("accountName", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Bank Name</label>
                <input className={inputClass} value={form.bank.bankName} onChange={(e) => setBank("bankName", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input className={inputClass} value={form.bank.accountNumber} onChange={(e) => setBank("accountNumber", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>IFSC</label>
                <input
                  className={inputClass}
                  value={form.bank.ifsc}
                  onChange={(e) => setBank("ifsc", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className={labelClass}>Branch</label>
                <input className={inputClass} value={form.bank.branch} onChange={(e) => setBank("branch", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>UPI ID</label>
                <input className={inputClass} value={form.bank.upiId} onChange={(e) => setBank("upiId", e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Default Terms & Conditions</label>
            <textarea
              rows={3}
              className={inputClass}
              value={form.defaultTerms}
              onChange={(e) => setForm({ ...form, defaultTerms: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Default Notes</label>
            <textarea
              rows={2}
              className={inputClass}
              value={form.defaultNotes}
              onChange={(e) => setForm({ ...form, defaultNotes: e.target.value })}
              placeholder="e.g. Thank you for your business."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
