"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
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
  ChevronRight,
} from "lucide-react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import {
  TitepoSpecsCard,
  TzarSpecsCard,
  AdshalaaSpecsCard,
  CrownleafSpecsCard,
} from "@/components/leads/brand-specs";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const BRAND_CONFIG: Record<
  BusinessSlug,
  { label: string; bg: string; text: string; logo: string }
> = {
  tzar: { label: "Tzar Agency", bg: "bg-emerald-700", text: "text-white", logo: "/tzar-logo.png" },
  adshalaa: { label: "Adshalaa EdTech", bg: "bg-blue-700", text: "text-white", logo: "/adshalaa-logo.png" },
  crownleaf: { label: "CrownLeaf Gifting", bg: "bg-amber-600", text: "text-white", logo: "/Crownleaf-logo.png" },
  titepo: { label: "Titepo Toys", bg: "bg-pink-600", text: "text-white", logo: "/titepo-logo.png" },
};

const STAGES: { id: KanbanStage; name: string }[] = [
  { id: "new-lead", name: "New Lead" },
  { id: "contacted", name: "Contacted" },
  { id: "discovery-call", name: "Discovery Call" },
  { id: "proposal-sent", name: "Proposal Sent" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed-won", name: "Closed Won" },
  { id: "closed-lost", name: "Closed Lost" },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const leadId = params.id as string;

  const [lead, setLead] = useState<Partial<ILead> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Edit Budget & Deal Details State
  const [isEditing, setIsEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number | string>(0);
  const [companyInput, setCompanyInput] = useState("");
  const [requirementsInput, setRequirementsInput] = useState("");
  const [stageInput, setStageInput] = useState<KanbanStage>("new-lead");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeline Notes State
  const [notesList, setNotesList] = useState<any[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const userRole = (session?.user as any)?.role || "BDE";
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  // Fetch Lead Data
  useEffect(() => {
    const fetchLeadDetails = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/v1/leads/${leadId}`);
        if (!res.ok) {
          setErrorMsg("Lead not found or access denied.");
          return;
        }
        const data = await res.json();
        if (data.lead) {
          setLead(data.lead);
          setBudgetInput(data.lead.estimatedBudget || 0);
          setCompanyInput(data.lead.companyName || "");
          setRequirementsInput(data.lead.requirementsMessage || "");
          setStageInput(data.lead.stageId || "new-lead");
        }
        if (data.messages) {
          setNotesList(data.messages);
        }
      } catch (err: any) {
        console.error("Fetch lead detail error:", err);
        setErrorMsg("Failed to load lead details.");
      } finally {
        setIsLoading(false);
      }
    };

    if (leadId) fetchLeadDetails();
  }, [leadId]);

  // Stage Stepper Update Handler
  const handleUpdateStage = async (targetStageId: KanbanStage) => {
    if (!lead || !lead._id) return;
    setStageInput(targetStageId);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: targetStageId }),
      });
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        const refRes = await fetch(`/api/v1/leads/${lead._id}`).then((r) => r.json());
        if (refRes.messages) setNotesList(refRes.messages);
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  // Save Lead Details
  const handleSaveDetails = async () => {
    if (!lead || !lead._id) return;
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
        setLead(data.lead);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Save details error:", err);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !lead || !lead._id) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });
      if (res.ok) {
        setNewNoteContent("");
        const refRes = await fetch(`/api/v1/leads/${lead._id}`).then((r) => r.json());
        if (refRes.messages) setNotesList(refRes.messages);
      }
    } catch (err) {
      console.error("Add note error:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Convert to Client Handler
  const handleConvertToClient = async () => {
    if (!lead || !lead._id) return;
    setIsConverting(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.client) {
        alert(`Successfully converted ${lead.fullName} to Client Account!`);
        setLead((prev) => (prev ? { ...prev, status: "CONVERTED" } : null));
      } else {
        alert(`Conversion error: ${data.error || "Failed"}`);
      }
    } catch (err) {
      console.error("Convert to client error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  // Delete Lead Handler (Admin Only)
  const handleDeleteLead = async () => {
    if (!lead || !lead._id) return;
    if (!confirm(`Are you sure you want to permanently delete lead ${lead.fullName}?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/pipeline");
      } else {
        alert("Failed to delete lead document.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-600 font-bold text-lg">{errorMsg || "Lead not found"}</p>
        <button
          onClick={() => router.push("/pipeline")}
          className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
        >
          Back to Pipeline
        </button>
      </div>
    );
  }

  const currentBrand = BRAND_CONFIG[(lead.business || "tzar") as BusinessSlug] || BRAND_CONFIG.tzar;
  const isOverdue = lead.slaDeadline ? new Date(lead.slaDeadline) < new Date() : false;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ─── TOP BREADCRUMB & ACTION HEADER BAR ───────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/pipeline")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all cursor-pointer"
              title="Back to Pipeline Grid"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                  {lead.leadCustomId || "TZ-LD-TEMP"}
                </span>

                {currentBrand.logo ? (
                  <img src={currentBrand.logo} alt={currentBrand.label} className="h-7 w-auto object-contain max-h-7" />
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl ${currentBrand.bg} ${currentBrand.text}`}>
                    {currentBrand.label}
                  </span>
                )}

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

              <h1 className="text-2xl font-bold text-slate-900 mt-1">
                {lead.fullName || "Anonymous Lead"}
              </h1>
              {lead.companyName && (
                <p className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> {lead.companyName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConvertToClient}
              disabled={isConverting || lead.status === "CONVERTED"}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                lead.status === "CONVERTED"
                  ? "bg-emerald-100 text-emerald-800 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              }`}
            >
              {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              {lead.status === "CONVERTED" ? "Converted Client" : "Convert to Client Account"}
            </button>

            {isSuperAdmin && (
              <button
                onClick={handleDeleteLead}
                disabled={isDeleting}
                className="p-2.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                title="Delete Lead Document (Admin Only)"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* ─── SALESFORCE STAGE PROGRESSION STEPPER ──────────────────────── */}
        <div className="bg-slate-900 p-4 rounded-xl space-y-2 border border-slate-800">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pipeline Stage Progression (Click to Change Stage)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {STAGES.map((stg, idx) => {
              const currentIdx = STAGES.findIndex((s) => s.id === (lead.stageId || "new-lead"));
              const isCurrent = stg.id === (lead.stageId || "new-lead");
              const isPast = idx < currentIdx;

              return (
                <button
                  key={stg.id}
                  onClick={() => handleUpdateStage(stg.id)}
                  className={`py-2 px-2 text-[11px] font-extrabold rounded-lg transition-all text-center truncate cursor-pointer ${
                    isCurrent
                      ? "bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/50"
                      : isPast
                      ? "bg-slate-700 text-emerald-400 hover:bg-slate-600"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80"
                  }`}
                  title={`Change lead stage to ${stg.name}`}
                >
                  {stg.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── MAIN 360 WORKSPACE CONTENT (2-COLUMN SALESFORCE/ZOHO LAYOUT) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (40% WIDTH): Contact Info, Facebook Date, Titepo Specs, Form Q&A */}
        <div className="lg:col-span-5 space-y-6">
          {/* Primary Contact Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Primary Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="min-w-0">
                <p className="text-slate-500 font-medium">Email Address</p>
                <a href={`mailto:${lead.email}`} className="font-bold text-slate-900 hover:underline flex items-center gap-1.5 mt-0.5 break-all">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {lead.email || "N/A"}
                </a>
              </div>

              <div className="min-w-0">
                <p className="text-slate-500 font-medium">Phone Number</p>
                <a href={`tel:${lead.phone}`} className="font-bold text-slate-900 hover:underline flex items-center gap-1.5 mt-0.5 break-words">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {lead.phone}
                </a>
              </div>

              <div className="min-w-0">
                <p className="text-slate-500 font-medium">City & Location</p>
                <p className="font-bold text-slate-900 flex items-center gap-1.5 mt-0.5 break-words">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.city || lead.titepoData?.streetAddress || [lead.country].filter(Boolean).join(", ") || "N/A"}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-slate-500 font-medium">Facebook Submitted Date</p>
                <p className="font-bold text-emerald-800 flex items-center gap-1.5 mt-0.5 break-words">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {lead.createdAt ? new Date(lead.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Brand-Specific Specification Cards (Honest Data, No Fake Fallbacks) */}
          {lead.business === "titepo" && <TitepoSpecsCard lead={lead} />}
          {lead.business === "tzar" && <TzarSpecsCard lead={lead} />}
          {lead.business === "adshalaa" && <AdshalaaSpecsCard lead={lead} />}
          {lead.business === "crownleaf" && <CrownleafSpecsCard lead={lead} />}

          {/* Facebook Lead Form Submitted Questions & Answers Card */}
          {lead.metaFormFields && lead.metaFormFields.length > 0 && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-md border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FacebookIcon className="w-4 h-4 fill-emerald-400" /> Facebook Lead Form Questions & Answers
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {lead.metaFormFields.length} Form Fields Captured
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {lead.metaFormFields.map((field, idx) => (
                  <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-0.5">
                    <p className="text-[11px] font-bold text-slate-400 capitalize">{field.label}</p>
                    <p className="text-xs font-bold text-emerald-300">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deal Value & BDE Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Deal Value & Requirements
              </h3>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl cursor-pointer">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSavingDetails}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {isSavingDetails ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Budget</span>
                  <p className="text-lg font-extrabold text-slate-900">₹{(lead.estimatedBudget || 0).toLocaleString()}</p>
                </div>
                {lead.requirementsMessage && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">Requirement Notes</span>
                    <p className="text-xs font-medium text-slate-800 mt-1 whitespace-pre-wrap">"{lead.requirementsMessage}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Budget (INR)</label>
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Requirements Note</label>
                  <textarea
                    rows={3}
                    value={requirementsInput}
                    onChange={(e) => setRequirementsInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (60% WIDTH): Zoho Activity Hub & Communication Stream */}
        <div className="lg:col-span-7 space-y-6">
          {/* Communication & Actions Hub */}
          <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" /> Communication Launcher
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Direct 1-click WhatsApp messaging and call action launcher
                </p>
              </div>

              <a
                href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${lead.fullName || ""}, thank you for contacting ${currentBrand.label}!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Launch WhatsApp Direct
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <a
                href={`tel:${lead.phone}`}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-900 flex items-center gap-2 justify-center"
              >
                <Phone className="w-4 h-4 text-blue-600" /> Call {lead.phone}
              </a>
              <a
                href={`mailto:${lead.email}`}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all font-bold text-slate-900 flex items-center gap-2 justify-center"
              >
                <Mail className="w-4 h-4 text-purple-600" /> Email {lead.email || "Lead"}
              </a>
            </div>
          </div>

          {/* Timeline & BDE Activity Log */}
          <div className="bg-white p-5 rounded-2xl border border-slate-300 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" /> Executive Activity Timeline & Notes ({notesList.length})
            </h3>

            {/* Post Activity Form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Log call outcome, client discovery notes, or follow-up tasks..."
                className="w-full text-xs font-semibold p-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-600 bg-slate-50/50"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteContent.trim()}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-emerald-400" />}
                  Post Activity Note
                </button>
              </div>
            </form>

            {/* Activity Stream */}
            <div className="space-y-3 pt-2 max-h-[450px] overflow-y-auto">
              {notesList.length === 0 ? (
                <p className="text-center text-xs font-semibold text-slate-500 py-8">
                  No activity notes logged yet. Log the first call outcome above!
                </p>
              ) : (
                notesList.map((n) => (
                  <div key={n._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-900">{n.senderName || "BDE Executive"}</span>
                      <span className="text-slate-400 font-mono">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
