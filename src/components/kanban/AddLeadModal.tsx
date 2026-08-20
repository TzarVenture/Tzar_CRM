"use client";

import { useState } from "react";
import { X, Loader2, Plus, UserPlus, DollarSign, Building, Phone, Mail, FileText, Tag } from "lucide-react";
import axios from "axios";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

const AVAILABLE_SERVICES = [
  { id: "website-development", label: "Website Development" },
  { id: "searchengineoptimization", label: "SEO Retainers" },
  { id: "ppc-digital-marketing", label: "PPC & Meta Ads" },
  { id: "branding-creative", label: "Branding & Creative" },
];

export default function AddLeadModal({
  isOpen,
  onClose,
  onLeadAdded,
}: AddLeadModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState<number>(5000);
  const [interestedServices, setInterestedServices] = useState<string[]>([]);
  const [requirementsMessage, setRequirementsMessage] = useState("");
  const [source, setSource] = useState("MANUAL");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleService = (serviceId: string) => {
    setInterestedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await axios.post("/api/v1/leads", {
        fullName,
        email,
        phone,
        companyName,
        estimatedBudget: Number(estimatedBudget),
        interestedServices,
        requirementsMessage,
        source,
      });

      onLeadAdded();
      onClose();
      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
      setCompanyName("");
      setEstimatedBudget(5000);
      setInterestedServices([]);
      setRequirementsMessage("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to create lead");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
        style={{ boxShadow: "var(--shadow-modal)" }}
      >
        {/* Top Accent Line */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: "var(--color-brand-green-light)" }}
            >
              <UserPlus
                className="w-5 h-5"
                style={{ color: "var(--color-brand-green)" }}
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Add New Lead Opportunity
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Create a new prospect entry in the sales pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Row 1: Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Enterprises"
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@acme.com"
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
              />
            </div>
          </div>

          {/* Row 3: Budget & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Estimated Budget ($ / ₹)
              </label>
              <input
                type="number"
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                placeholder="5000"
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) outline-none transition-all cursor-pointer"
              >
                <option value="MANUAL">Manual Entry</option>
                <option value="WEBSITE_SERVICE_FORM">Website Service Form</option>
                <option value="WEBSITE_CONTACT">Website Contact</option>
                <option value="META_LEAD_AD">Meta Lead Ad</option>
                <option value="WHATSAPP_INBOUND">WhatsApp Inbound</option>
              </select>
            </div>
          </div>

          {/* Service Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Interested Services
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SERVICES.map((srv) => {
                const isSelected = interestedServices.includes(srv.id);
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => toggleService(srv.id)}
                    className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-(--color-brand-green) text-white border-(--color-brand-green) shadow-xs"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {srv.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discovery Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Requirements & Notes
            </label>
            <textarea
              rows={3}
              value={requirementsMessage}
              onChange={(e) => setRequirementsMessage(e.target.value)}
              placeholder="Add discovery notes, project timeline requirements, special client requests..."
              className="w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) focus:ring-2 focus:ring-(--color-brand-green)/10 outline-none transition-all"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: "var(--color-brand-green)" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Lead...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Opportunity
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
