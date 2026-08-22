"use client";

import React, { useState } from "react";
import axios from "axios";
import { X, UserPlus, Building2, BookOpen, Gift, ShoppingBag, Briefcase, Plus, Loader2 } from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (newLead?: any) => void;
}

export function CreateLeadModal({ isOpen, onClose, onLeadCreated }: CreateLeadModalProps) {
  const [business, setBusiness] = useState<BusinessSlug>("tzar");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState<number>(50000);
  const [source, setSource] = useState("MANUAL");
  const [requirementsMessage, setRequirementsMessage] = useState("");

  // Entity-Specific Payload States
  const [programName, setProgramName] = useState("Certification in Advanced Digital Marketing");
  const [batch, setBatch] = useState("Weekend Batch");
  const [giftingCategory, setGiftingCategory] = useState("Corporate Festive Hampers");
  const [quantityUnits, setQuantityUnits] = useState<number>(250);
  const [toyCategory, setToyCategory] = useState("STEM Educational Puzzles");
  const [services, setServices] = useState("Performance Marketing & SEO");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Build dynamic entity payload
      const payload: any = {
        business,
        fullName,
        email,
        phone,
        companyName: companyName || undefined,
        estimatedBudget: Number(estimatedBudget) || 0,
        source,
        requirementsMessage,
        interestedServices: [services],
      };

      if (business === "tzar") {
        payload.tzarData = { domain: companyName, formType: "CONTACT" };
      } else if (business === "adshalaa") {
        payload.adshalaaData = { programName, batch, formType: "ENQUIRY" };
      } else if (business === "crownleaf") {
        payload.crownleafData = { giftingCategory, quantityUnits: Number(quantityUnits) };
      } else if (business === "titepo") {
        payload.titepoData = { eventType: toyCategory, kidsCount: Number(quantityUnits) };
      }

      const res = await axios.post("/api/v1/leads", payload);

      onLeadCreated(res.data?.lead);
      onClose();
    } catch (err: any) {
      console.error("Failed to create manual lead:", err);
      setError(err.response?.data?.error || "Failed to create lead. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
        {/* Accent Bar */}
        <div
          className="h-1.5 w-full transition-colors"
          style={{
            backgroundColor:
              business === "tzar"
                ? "#047857"
                : business === "adshalaa"
                ? "#1d4ed8"
                : business === "crownleaf"
                ? "#d97706"
                : "#dc2626",
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add New Manual Lead</h2>
              <p className="text-xs font-semibold text-slate-500">
                Manually record inbound sales enquiry across Tzar Group business units
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

        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* 1. Business Entity Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Business Unit
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "tzar", label: "Tzar Agency", icon: Briefcase, color: "emerald" },
                { id: "adshalaa", label: "Adshalaa EdTech", icon: BookOpen, color: "blue" },
                { id: "crownleaf", label: "CrownLeaf Gifting", icon: Gift, color: "amber" },
                { id: "titepo", label: "Titepo Toys", icon: ShoppingBag, color: "rose" },
              ].map((b) => {
                const Icon = b.icon;
                const active = business === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBusiness(b.id as BusinessSlug)}
                    className={`flex items-center gap-2 p-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                        : "bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{b.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Core Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@company.com"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Institution Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Innovations"
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* 3. Entity-Specific Custom Fields */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              {business === "tzar" && "Tzar Agency Service Details"}
              {business === "adshalaa" && "Adshalaa EdTech Course Admission Details"}
              {business === "crownleaf" && "CrownLeaf Corporate Gifting Details"}
              {business === "titepo" && "Titepo Wholesale Toys Inquiry Details"}
            </h4>

            {business === "tzar" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Requested Marketing / Dev Service
                </label>
                <input
                  type="text"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="SEO, Performance Marketing, Next.js Development"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                />
              </div>
            )}

            {business === "adshalaa" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Course / Program Name
                  </label>
                  <input
                    type="text"
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Preferred Batch
                  </label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Weekend Batch">Weekend Batch (Sat-Sun)</option>
                    <option value="Weekday Evening">Weekday Evening Batch</option>
                    <option value="Online Self-Paced">Online Self-Paced</option>
                  </select>
                </div>
              </div>
            )}

            {business === "crownleaf" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Gifting Category / Occasion
                  </label>
                  <input
                    type="text"
                    value={giftingCategory}
                    onChange={(e) => setGiftingCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Expected Gift Units Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityUnits}
                    onChange={(e) => setQuantityUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>
            )}

            {business === "titepo" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Toy Category / Bulk Inquiry
                  </label>
                  <input
                    type="text"
                    value={toyCategory}
                    onChange={(e) => setToyCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Wholesale Order Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityUnits}
                    onChange={(e) => setQuantityUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Budget & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Deal Budget (₹)
              </label>
              <input
                type="number"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lead Channel / Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
              >
                <option value="MANUAL">Manual Inbound Call / Visit</option>
                <option value="WEBSITE_ENQUIRY">Website Enquiry Form</option>
                <option value="META_LEAD_AD">Meta Lead Ad Form</option>
                <option value="WHATSAPP_INBOUND">Direct WhatsApp Message</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Requirements Note / Notes
            </label>
            <textarea
              rows={2}
              value={requirementsMessage}
              onChange={(e) => setRequirementsMessage(e.target.value)}
              placeholder="Add key notes from initial discussion with client..."
              className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-300 outline-none resize-none"
            />
          </div>

          {/* Footer CTAs */}
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
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer bg-slate-900 hover:bg-slate-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating Lead...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Manual Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
