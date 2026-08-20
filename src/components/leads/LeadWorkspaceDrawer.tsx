"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Send,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ExternalLink,
  BookOpen,
  ShoppingBag,
  Gift,
  Briefcase,
  Edit2,
  Save,
  PlusCircle,
  Loader2,
  Trash2,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";

interface LeadWorkspaceDrawerProps {
  lead: Partial<ILead> | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedFields: Partial<ILead>) => void;
  onDeleteLead?: (leadId: string) => void;
}

const STAGES: { id: KanbanStage; name: string }[] = [
  { id: "new-lead", name: "New Lead" },
  { id: "contacted", name: "Contacted" },
  { id: "discovery-call", name: "Discovery Call" },
  { id: "proposal-sent", name: "Proposal Sent" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed-won", name: "Closed Won" },
  { id: "closed-lost", name: "Closed Lost" },
];

export function LeadWorkspaceDrawer({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  onDeleteLead,
}: LeadWorkspaceDrawerProps) {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "activity" | "files">("overview");

  // Lead Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number | string>(0);
  const [companyInput, setCompanyInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [stageInput, setStageInput] = useState<KanbanStage>("new-lead");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Conversion & Deletion Action States
  const [isConverting, setIsConverting] = useState(false);
  const [convertedInfo, setConvertedInfo] = useState<{ portalUrl: string; passcode: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState(false);

  // Notes & Activity Stream State
  const [notesList, setNotesList] = useState<any[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Load Lead Notes and Details when Drawer Opens
  useEffect(() => {
    if (lead?._id && isOpen) {
      setBudgetInput(lead.estimatedBudget || 0);
      setCompanyInput(lead.companyName || "");
      setRequirementsInput(lead.requirementsMessage || "");
      setStageInput((lead.stageId as KanbanStage) || "new-lead");
      setConvertedInfo(null);

      setIsLoadingNotes(true);
      fetch(`/api/v1/leads/${lead._id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setNotesList(data.messages);
          }
          if (data.lead) {
            setBudgetInput(data.lead.estimatedBudget || 0);
            setCompanyInput(data.lead.companyName || "");
            setRequirementsInput(data.lead.requirementsMessage || "");
            setStageInput(data.lead.stageId || "new-lead");
          }
        })
        .catch((err) => console.error("Error fetching lead messages:", err))
        .finally(() => setIsLoadingNotes(false));
    }
  }, [lead?._id, isOpen]);

  if (!isOpen || !lead) return null;

  const business = (lead.business || "tzar") as BusinessSlug;

  const brandBadgeColors: Record<BusinessSlug, { bg: string; text: string; label: string; icon: any }> = {
    tzar: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Tzar Agency", icon: Briefcase },
    adshalaa: { bg: "bg-blue-100", text: "text-blue-800", label: "Adshalaa EdTech", icon: BookOpen },
    crownleaf: { bg: "bg-amber-100", text: "text-amber-800", label: "CrownLeaf Gifting", icon: Gift },
    titepo: { bg: "bg-pink-100", text: "text-pink-800", label: "Titepo Toys", icon: ShoppingBag },
  };

  const currentBrand = brandBadgeColors[business] || brandBadgeColors.tzar;
  const BrandIcon = currentBrand.icon;

  const isOverdue = lead.slaDeadline ? new Date(lead.slaDeadline) < new Date() : false;

  // Handle Client Conversion Workflow
  const handleConvertToClient = async () => {
    if (!lead._id) return;
    setIsConverting(true);

    try {
      const res = await fetch("/api/v1/clients/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead._id.toString(),
          companyName: companyInput || lead.companyName || lead.fullName || "Client Account",
          monthlyRetainerBudget: typeof budgetInput === "number" ? budgetInput : parseFloat(budgetInput) || 5000,
        }),
      });

      const data = await res.json();
      if (data.status === "converted" || data.status === "exists") {
        setConvertedInfo({
          portalUrl: data.portalUrl || `/portal/${data.client._id}`,
          passcode: data.portalPasscode || data.client?.portalPasscode || "889900",
        });

        onUpdateLead({
          stageId: "closed-won",
          status: "CONVERTED",
          convertedClientId: data.client._id,
        });

        // Refresh notes timeline
        const refRes = await fetch(`/api/v1/leads/${lead._id}`).then((r) => r.json());
        if (refRes.messages) setNotesList(refRes.messages);
      } else {
        alert(data.error || "Failed to convert lead to client");
      }
    } catch (err) {
      console.error("Conversion error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle Admin Delete Lead
  const handleDeleteLead = async () => {
    if (!lead._id) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete lead [${lead.leadCustomId} - ${lead.fullName}]? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        if (onDeleteLead) onDeleteLead(lead._id.toString());
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete lead document");
      }
    } catch (err) {
      console.error("Delete Lead Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };


  // Handle Save Lead Details & Budget
  const handleSaveDetails = async () => {
    if (!lead._id) return;
    setIsSavingDetails(true);
    try {
      const parsedBudget = typeof budgetInput === "string" ? parseFloat(budgetInput) || 0 : budgetInput;

      const res = await fetch(`/api/v1/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimatedBudget: parsedBudget,
          companyName: companyInput,
          requirementsMessage: requirementsInput,
          stageId: stageInput,
        }),
      });

      const data = await res.json();
      if (data.lead) {
        onUpdateLead(data.lead);
        setIsEditing(false);

        // Refresh notes list to display new stage/details system log
        const refRes = await fetch(`/api/v1/leads/${lead._id}`).then((r) => r.json());
        if (refRes.messages) setNotesList(refRes.messages);
      }
    } catch (err) {
      console.error("Failed to update lead details:", err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !lead._id) return;
    setIsSubmittingNote(true);

    try {
      const res = await fetch(`/api/v1/leads/${lead._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });

      const data = await res.json();
      if (data.note) {
        setNotesList((prev) => [...prev, data.note]);
        setNewNoteContent("");
      }
    } catch (err) {
      console.error("Failed to add internal note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 transition-transform transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                {lead.leadCustomId || "TZ-LD-TEMP"}
              </span>

              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${currentBrand.bg} ${currentBrand.text}`}>
                <BrandIcon className="w-3.5 h-3.5" />
                {currentBrand.label}
              </span>

              {isOverdue ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                  <AlertTriangle className="w-3 h-3" /> SLA Overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Clock className="w-3 h-3 text-emerald-600" /> Active SLA
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mt-2">
              {lead.fullName || "Anonymous Lead"}
            </h2>
            {lead.companyName && (
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {lead.companyName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Convert to Client Button */}
            <button
              onClick={handleConvertToClient}
              disabled={isConverting || lead.status === "CONVERTED"}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                lead.status === "CONVERTED"
                  ? "bg-emerald-100 text-emerald-800 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              {isConverting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {lead.status === "CONVERTED" ? "Converted Client Account" : "Convert to Client"}
            </button>

            {/* Delete Lead Button (Restricted Strictly to Super Admin / Agency Owner) */}
            {isSuperAdmin && (
              <button
                onClick={handleDeleteLead}
                disabled={isDeleting}
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                title="Delete Lead Document (Owner Privilege Only)"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Onboarding Portal Banner (Appears on Conversion) */}
        {convertedInfo && (
          <div className="bg-emerald-60 text-white p-4 px-6 flex items-center justify-between animate-fade-in" style={{ backgroundColor: "#047857" }}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider">Client Onboarding Active!</span>
              </div>
              <p className="text-xs font-semibold text-emerald-100">
                Send passcode to client: <span className="font-mono font-extrabold text-white text-sm bg-emerald-900/60 px-2 py-0.5 rounded-md">{convertedInfo.passcode}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(convertedInfo.passcode);
                  setCopiedPasscode(true);
                  setTimeout(() => setCopiedPasscode(false), 2000);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-900/60 text-white rounded-xl hover:bg-emerald-900 transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedPasscode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPasscode ? "Copied!" : "Copy Passcode"}
              </button>

              <a
                href={convertedInfo.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-xs font-bold bg-white text-emerald-900 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Portal
              </a>
            </div>
          </div>
        )}

        {/* Tab Navigation Header */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Overview & Schema Details
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Chat
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "activity"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Timeline & Activity Log ({notesList.length})
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "files"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Attached Files
          </button>
        </div>

        {/* Main Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contact Information Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Primary Contact Details
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500 font-medium">Email Address</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-semibold text-slate-900 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email || "N/A"}
                    </a>
                  </div>

                  <div>
                    <p className="text-slate-500 font-medium">Phone Number</p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-semibold text-slate-900 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {lead.phone}
                    </a>
                  </div>

                  <div>
                    <p className="text-slate-500 font-medium">City & Location</p>
                    <p className="font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {[lead.city, lead.country].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500 font-medium">Lead Source</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {lead.source || "WEBSITE_CONTACT"}
                    </p>
                  </div>
                </div>
              </div>

              {/* BDE Edit & Budget Management Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> Lead Interest & BDE Deal Value
                  </h3>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Budget & Details
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetails}
                        className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {isSavingDetails ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {!isEditing ? (
                  /* Read Mode */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Deal Budget</span>
                        <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                          {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : "Unbudgeted"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Stage</span>
                        <p className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg mt-0.5">
                          {lead.stageId || "new-lead"}
                        </p>
                      </div>
                    </div>

                    {lead.interestedServices && lead.interestedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lead.interestedServices.map((service, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                    {lead.requirementsMessage && (
                      <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-700 space-y-1">
                        <p className="font-bold text-slate-900">Message / Goal Description:</p>
                        <p className="whitespace-pre-wrap leading-relaxed">{lead.requirementsMessage}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode Form */
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Estimated Budget (₹)
                        </label>
                        <input
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Lead Stage
                        </label>
                        <select
                          value={stageInput}
                          onChange={(e) => setStageInput(e.target.value as KanbanStage)}
                          className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 bg-white"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        placeholder="Company / Business Name"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Requirements / Deal Notes
                      </label>
                      <textarea
                        rows={3}
                        value={requirementsInput}
                        onChange={(e) => setRequirementsInput(e.target.value)}
                        placeholder="Detail client specifications, scope, or timeline..."
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Brand-Specific Payload Details */}
              {business === "tzar" && lead.tzarData && (
                <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-700" /> Tzar Agency Specification
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-emerald-700 font-medium">Domain / Website:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.tzarData.domain || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium">Form Category:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.tzarData.formType || "CONTACT"}</p>
                    </div>
                    {lead.tzarData.resumeUrl && (
                      <div className="col-span-2">
                        <span className="text-emerald-700 font-medium">Candidate Resume:</span>
                        <a
                          href={lead.tzarData.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-800 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Uploaded PDF Resume <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {business === "adshalaa" && lead.adshalaaData && (
                <div className="bg-blue-50/50 border border-blue-200 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-700" /> Adshalaa Course & Student Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-blue-700 font-medium">Target Program:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.adshalaaData.programName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Professional Status:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.adshalaaData.professionalStatus || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Preferred Batch:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.adshalaaData.batch || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-blue-700 font-medium">Form Source Type:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.adshalaaData.formType || "ENQUIRY"}</p>
                    </div>
                  </div>
                </div>
              )}

              {business === "crownleaf" && lead.crownleafData && (
                <div className="bg-amber-50/50 border border-amber-200 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-700" /> CrownLeaf Corporate Gifting Spec
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-amber-700 font-medium">Gifting Category:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.crownleafData.giftingCategory || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-amber-700 font-medium">Quantity / Units:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.crownleafData.quantityUnits || "N/A"} pcs</p>
                    </div>
                  </div>
                </div>
              )}

              {business === "titepo" && lead.titepoData && (
                <div className="bg-pink-50/50 border border-pink-200 p-5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-pink-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-pink-700" /> Titepo Kids Toys & Return Gifts
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-pink-700 font-medium">Event Type:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.titepoData.eventType || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-pink-700 font-medium">Kids Count:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{lead.titepoData.kidsCount || "N/A"} kids</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">WhatsApp Messaging Console</h3>
                  <p className="text-[11px] text-slate-500">Connected to Meta Cloud API (+91 7304056607)</p>
                </div>
                <a
                  href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Launch WhatsApp App
                </a>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-2 border border-slate-200">
                <p className="font-semibold text-slate-900">Quick Template Messages:</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium hover:border-emerald-500 cursor-pointer">
                    👋 Welcome Ping
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium hover:border-emerald-500 cursor-pointer">
                    📅 Schedule Discovery Call
                  </button>
                  <button className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium hover:border-emerald-500 cursor-pointer">
                    📄 Send Proposal PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Add Note Input Form */}
              <form onSubmit={handleAddNote} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" /> Add BDE Activity Note / Call Log
                </h3>

                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record call discussion, client feedback, budget updates, or next step..."
                  className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-slate-50 focus:bg-white transition-all"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    className="px-4 py-2 text-xs font-bold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Post Activity Note
                  </button>
                </div>
              </form>

              {/* Dynamic Timeline Stream */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Workflow Timeline & Step-by-Step Audit Logs
                </h3>

                {isLoadingNotes ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Loading activity timeline...
                  </div>
                ) : notesList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                    No activity notes recorded yet. Add your first note above!
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {notesList.map((msg, idx) => {
                      const isSystem = msg.channel === "SYSTEM_NOTE";

                      return (
                        <div key={msg._id || idx} className="relative pl-8 text-xs space-y-1">
                          <div className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 bg-white ${isSystem ? "border-blue-500" : "border-emerald-500"}`} />

                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                              <span className={`font-bold ${isSystem ? "text-blue-700" : "text-emerald-700"}`}>
                                {isSystem ? "⚙️ System Workflow Log" : `👤 ${msg.senderInfo?.name || "BDE Note"}`}
                              </span>
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-900 font-medium whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-center py-12">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No attached proposals or invoices yet</p>
              <p className="text-[11px] text-slate-500">
                Uploaded PDFs, proposals, and studio shoot previews will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
