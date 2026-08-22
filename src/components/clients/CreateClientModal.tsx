"use client";

import React, { useState } from "react";
import axios from "axios";
import { X, Building2, UserCheck, Plus, Loader2 } from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (newClient?: any) => void;
}

export function CreateClientModal({ isOpen, onClose, onClientCreated }: CreateClientModalProps) {
  const [companyName, setCompanyName] = useState("");
  const [business, setBusiness] = useState<BusinessSlug>("tzar");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contractValue, setContractValue] = useState<number>(120000);
  const [healthScore, setHealthScore] = useState<"HEALTHY" | "AT_RISK" | "CRITICAL">("HEALTHY");
  const [activeServices, setActiveServices] = useState("Full-Funnel Digital Marketing");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await axios.post("/api/v1/clients", {
        companyName,
        business,
        primaryContact: {
          name: contactName,
          email,
          phone,
        },
        monthlyRetainer: Number(contractValue) || 0,
        healthScore,
        activeServices: [activeServices],
      });

      onClientCreated(res.data?.client);
      onClose();
    } catch (err: any) {
      console.error("Failed to create client account:", err);
      setError(err.response?.data?.error || "Failed to create client account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Client Account</h2>
              <p className="text-xs font-semibold text-slate-500">
                Manually record paying account & active retainer scope
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. SkillGro Corp / CrownLeaf Retail"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Business Unit</label>
              <select
                value={business}
                onChange={(e) => setBusiness(e.target.value as BusinessSlug)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
              >
                <option value="tzar">Tzar Agency</option>
                <option value="adshalaa">Adshalaa EdTech</option>
                <option value="crownleaf">CrownLeaf Gifting</option>
                <option value="titepo">Titepo Toys</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Name *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Vikram Sharma"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vikram@company.com"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 11111"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Retainer (₹)</label>
              <input
                type="number"
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Health Status</label>
              <select
                value={healthScore}
                onChange={(e) => setHealthScore(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
              >
                <option value="HEALTHY">🟢 Healthy (Active)</option>
                <option value="AT_RISK">🟡 At Risk</option>
                <option value="CRITICAL">🔴 Critical Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Active Deliverable Scope</label>
            <input
              type="text"
              value={activeServices}
              onChange={(e) => setActiveServices(e.target.value)}
              placeholder="SEO, Meta Ads Campaign Management, UI Revamp"
              className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
            />
          </div>

          {/* Footer */}
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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer bg-blue-700 hover:bg-blue-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Client Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
