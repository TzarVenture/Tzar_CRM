"use client";

import React, { useState, useEffect } from "react";
import { X, Buildings as Building2, Envelope as Mail, Phone, MapPin, CalendarBlank as Calendar, CurrencyDollar as DollarSign, Clock, PaperPlaneTilt as Send, FileText, ChatText as MessageSquare, CheckCircle as CheckCircle2, Warning as AlertTriangle, UserCheck, ArrowSquareOut as ExternalLink, BookOpen, ShoppingBag, Gift, Briefcase, PencilSimple as Edit2, FloppyDisk as Save, PlusCircle, SpinnerGap as Loader2, Trash as Trash2, Key, Copy, Check } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import { useDialogBehavior } from "@/hooks/use-dialog";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
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

/** META_LEAD_AD becomes "Meta lead ad". */
function sourceText(source?: string): string {
  if (!source) return "Website contact";
  const t = source.replace(/_/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

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

  const dialogRef = useDialogBehavior(isOpen, onClose);
  const { notify } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!isOpen || !lead) return null;

  const business = (lead.business || "tzar") as BusinessSlug;

  const brandBadgeColors: Record<BusinessSlug, { bg: string; text: string; label: string; icon: any }> = {
    tzar: { bg: "bg-success-soft", text: "text-success", label: "Tzar Agency", icon: Briefcase },
    adshalaa: { bg: "bg-info-soft", text: "text-info", label: "Adshalaa EdTech", icon: BookOpen },
    crownleaf: { bg: "bg-warning-soft", text: "text-warning", label: "CrownLeaf Gifting", icon: Gift },
    titepo: { bg: "bg-muted", text: "text-foreground", label: "Titepo Toys", icon: ShoppingBag },
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
        notify("error", data.error || "Could not convert this lead.");
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
        notify("error", err.error || "Could not delete this lead.");
      }
    } catch (err) {
      console.error("Delete Lead Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };


  const handleSaveDetailsWithStage = async (targetStageId: KanbanStage) => {
    if (!lead._id) return;
    setStageInput(targetStageId);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId: targetStageId,
        }),
      });

      const data = await res.json();
      if (data.lead) {
        onUpdateLead(data.lead);

        // Refresh notes timeline
        const refRes = await fetch(`/api/v1/leads/${lead._id}`).then((r) => r.json());
        if (refRes.messages) setNotesList(refRes.messages);
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-fade-in">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Lead details" tabIndex={-1}
        className="w-full max-w-6xl bg-card h-[94vh] rounded-3xl shadow-2xl flex flex-col border border-input overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-muted flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-mono font-semibold text-foreground">
                {lead.leadCustomId || "TZ-LD-TEMP"}
              </span>

              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <BrandIcon className="w-3.5 h-3.5" />
                {currentBrand.label}
              </span>

              {isOverdue ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
                  <AlertTriangle className="w-4 h-4" /> SLA overdue
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" /> Within SLA
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold text-foreground mt-2">
              {lead.fullName || "Unnamed lead"}
            </h2>
            {lead.companyName && (
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> {lead.companyName}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Convert to Client Button */}
            <button
              onClick={handleConvertToClient}
              disabled={isConverting || lead.status === "CONVERTED"}
              className={`px-3 py-1.5 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                lead.status === "CONVERTED"
                  ? "border border-input bg-card text-foreground cursor-default"
                  : "bg-primary hover:bg-primary-hover text-primary-foreground"
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
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
                className="p-2 rounded-lg text-destructive hover:bg-destructive-soft border border-input transition-colors cursor-pointer"
                title="Delete Lead Document (Owner Privilege Only)"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Onboarding Portal Banner (Appears on Conversion) */}
        {convertedInfo && (
          <div className="border-b border-border bg-success-soft text-foreground p-4 px-6 flex items-center justify-between animate-fade-in">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="text-sm font-semibold ">Client Onboarding Active!</span>
              </div>
              <p className="text-sm text-foreground">
                Send passcode to client: <span className="font-mono font-semibold text-sm text-foreground bg-card border border-border px-2 py-0.5 rounded-md">{convertedInfo.passcode}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(convertedInfo.passcode);
                  setCopiedPasscode(true);
                  setTimeout(() => setCopiedPasscode(false), 2000);
                }}
                className="px-3 py-1.5 text-sm font-medium border border-input bg-card text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPasscode ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPasscode ? "Copied!" : "Copy Passcode"}
              </button>

              <a
                href={convertedInfo.portalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-sm font-medium border border-input bg-card text-foreground rounded-lg hover:bg-muted transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Portal
              </a>
            </div>
          </div>
        )}

        {/* Salesforce / Zoho Style Stage Stepper & Quick Action Bar */}
        <div className="border-b border-border bg-card p-4 px-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              Pipeline Stage Progression
            </span>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${(lead.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${lead.fullName || ""}! Thank you for inquiring with ${currentBrand.label}. How can our team assist you today?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors flex items-center gap-1.5"
                title="Send 1-Click WhatsApp Message"
              >
                <Send className="w-3.5 h-3.5" /> WhatsApp
              </a>

              <a
                href={`tel:${lead.phone}`}
                className="px-3 py-1.5 text-sm font-medium border border-input bg-card hover:bg-muted text-foreground rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call
              </a>
            </div>
          </div>

          {/* Interactive Stepper */}
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
            {STAGES.map((stg, idx) => {
              const isCurrent = lead.stageId === stg.id;
              const isPast = STAGES.findIndex((s) => s.id === lead.stageId) > idx;

              return (
                <button
                  key={stg.id}
                  onClick={() => {
                    handleSaveDetailsWithStage(stg.id);
                  }}
                  className={`py-2 px-1 text-sm font-medium rounded-lg border transition-colors text-center truncate cursor-pointer ${
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : isPast
                      ? "border-input bg-muted text-foreground hover:bg-border"
                      : "border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={`Move lead stage to ${stg.name}`}
                >
                  {stg.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="flex overflow-x-auto border-b border-border bg-card px-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Schema Details
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "chat"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Chat
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "activity"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Timeline & Activity Log ({notesList.length})
          </button>

          <button
            onClick={() => setActiveTab("files")}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === "files"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Attached Files
          </button>
        </div>

        {/* Main Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Column (40% width): Contact Info, Titepo Specs, Budget */}
              <div className="xl:col-span-5 space-y-6">
                {/* Contact Information Card */}
              <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-2xs">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Primary Contact Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground font-medium">Email Address</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-semibold text-foreground hover:underline flex items-center gap-1 mt-0.5 break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {lead.email || "N/A"}
                    </a>
                  </div>

                  <div>
                    <p className="text-muted-foreground font-medium">Phone Number</p>
                    <a
                      href={`tel:${lead.phone}`}
                      className="font-semibold text-foreground hover:underline flex items-center gap-1 mt-0.5 break-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {lead.phone}
                    </a>
                  </div>

                  <div>
                    <p className="text-muted-foreground font-medium">City & Location</p>
                    <p className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />{" "}
                      {[lead.city, lead.country].filter(Boolean).join(", ") || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Lead Source</p>
                    <span className="font-semibold text-foreground">{sourceText(lead.source)}</span>
                  </div>
                </div>
              </div>
              {/* Dynamic Brand-Specific Specification Cards (Honest Data, No Fake Fallbacks) */}
              {lead.business === "titepo" && <TitepoSpecsCard lead={lead} />}
              {lead.business === "tzar" && <TzarSpecsCard lead={lead} />}
              {lead.business === "adshalaa" && <AdshalaaSpecsCard lead={lead} />}
              {lead.business === "crownleaf" && <CrownleafSpecsCard lead={lead} />}

              {/* BDE Edit & Budget Management Card */}
              <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-success" /> Lead Interest & BDE Deal Value
                  </h3>

                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary-hover transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Budget & Details
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-sm font-semibold bg-border text-foreground rounded-xl hover:bg-input transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDetails}
                        disabled={isSavingDetails}
                        className="px-3 py-1.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary transition-all flex items-center gap-1 cursor-pointer"
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
                    <div className="flex items-center justify-between bg-muted p-3.5 rounded-xl border border-border">
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground ">Estimated Deal Budget</span>
                        <p className="text-lg font-semibold text-foreground mt-0.5">
                          {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : "Unbudgeted"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-muted-foreground ">Current Stage</span>
                        <p className="text-sm font-semibold text-success bg-success-soft px-2.5 py-1 rounded-lg mt-0.5">
                          {lead.stageId || "new-lead"}
                        </p>
                      </div>
                    </div>

                    {lead.interestedServices && lead.interestedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {lead.interestedServices.map((service, idx) => (
                          <span
                            key={idx}
                            className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-muted text-foreground border border-border"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    )}

                    {lead.requirementsMessage && (
                      <div className="p-3.5 rounded-xl bg-muted text-sm text-foreground space-y-1">
                        <p className="font-semibold text-foreground">Message / Goal Description:</p>
                        <p className="whitespace-pre-wrap leading-relaxed">{lead.requirementsMessage}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode Form */
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground block mb-1">
                          Estimated Budget (₹)
                        </label>
                        <input
                          type="number"
                          value={budgetInput}
                          onChange={(e) => setBudgetInput(e.target.value)}
                          placeholder="e.g. 50000"
                          className="w-full text-sm font-semibold p-2.5 rounded-xl border border-input outline-none focus:border-success bg-card"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground block mb-1">
                          Lead Stage
                        </label>
                        <select
                          value={stageInput}
                          onChange={(e) => setStageInput(e.target.value as KanbanStage)}
                          className="w-full text-sm font-semibold p-2.5 rounded-xl border border-input outline-none focus:border-success bg-card"
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
                      <label className="text-sm font-semibold text-foreground block mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companyInput}
                        onChange={(e) => setCompanyInput(e.target.value)}
                        placeholder="Company / Business Name"
                        className="w-full text-sm font-semibold p-2.5 rounded-xl border border-input outline-none focus:border-success bg-card"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground block mb-1">
                        Requirements / Deal Notes
                      </label>
                      <textarea
                        rows={3}
                        value={requirementsInput}
                        onChange={(e) => setRequirementsInput(e.target.value)}
                        placeholder="Detail client specifications, scope, or timeline..."
                        className="w-full text-sm font-semibold p-2.5 rounded-xl border border-input outline-none focus:border-success bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Brand-Specific Payload Details */}
              {business === "tzar" && lead.tzarData && (
                <div className="bg-success-soft border border-border p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-success flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-success" /> Tzar Agency Specification
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-3 text-sm">
                    <div>
                      <span className="text-success font-medium">Domain / Website:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.tzarData.domain || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-success font-medium">Form Category:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.tzarData.formType || "CONTACT"}</p>
                    </div>
                    {lead.tzarData.resumeUrl && (
                      <div className="col-span-2">
                        <span className="text-success font-medium">Candidate Resume:</span>
                        <a
                          href={lead.tzarData.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-success hover:underline flex items-center gap-1 mt-0.5 break-all"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Uploaded PDF Resume <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {business === "adshalaa" && lead.adshalaaData && (
                <div className="bg-info-soft border border-border p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-info flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-info" /> Adshalaa Course & Student Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-3 text-sm">
                    <div>
                      <span className="text-info font-medium">Target Program:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.adshalaaData.programName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-info font-medium">Professional Status:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.adshalaaData.professionalStatus || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-info font-medium">Preferred Batch:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.adshalaaData.batch || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-info font-medium">Form Source Type:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.adshalaaData.formType || "ENQUIRY"}</p>
                    </div>
                  </div>
                </div>
              )}

              {business === "crownleaf" && lead.crownleafData && (
                <div className="bg-warning-soft border border-border p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-warning flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-warning" /> CrownLeaf Corporate Gifting Spec
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-3 text-sm">
                    <div>
                      <span className="text-warning font-medium">Gifting Category:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.crownleafData.giftingCategory || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-warning font-medium">Quantity / Units:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.crownleafData.quantityUnits || "N/A"} pcs</p>
                    </div>
                  </div>
                </div>
              )}

              {business === "titepo" && lead.titepoData && (
                <div className="bg-muted border border-border p-5 rounded-2xl space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-foreground" /> Titepo Kids Toys & Return Gifts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-3 text-sm">
                    <div>
                      <span className="text-foreground font-medium">Event Type:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.titepoData.eventType || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Kids Count:</span>
                      <p className="font-semibold text-foreground mt-0.5">{lead.titepoData.kidsCount || "N/A"} kids</p>
                    </div>
                  </div>
                </div>
              )}

              {/* All Submitted Meta Lead Form Questions & Answers Card */}
              {lead.metaFormFields && lead.metaFormFields.length > 0 && (
                <div className="bg-card p-5 rounded-xl space-y-3 shadow-xs border border-border">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-base font-semibold text-foreground flex items-center gap-1.5">
                    <FacebookIcon className="w-4 h-4 fill-current" /> Facebook Lead Form Questions & Answers
                    </h4>
                    <span className="text-sm text-muted-foreground">
                      {lead.metaFormFields.length} Form Fields Captured
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {lead.metaFormFields.map((field, idx) => (
                      <div key={idx} className="bg-muted p-3 rounded-lg border border-border space-y-0.5">
                        <p className="text-xs font-semibold text-muted-foreground capitalize">
                          ❓ {field.label}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {field.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

              {/* Right Column (60% width): Zoho CRM Activity Hub & Communication Stream */}
              <div className="xl:col-span-7 space-y-6">
                {/* Quick Communication Hub */}
                <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Send className="w-4 h-4 text-success" /> Communication & Actions Hub
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        Direct 1-click WhatsApp messaging and call action launcher
                      </p>
                    </div>

                    <a
                      href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        `Hello ${lead.fullName || ""}, thank you for contacting ${currentBrand.label}!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 text-sm font-semibold bg-primary hover:bg-primary text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Launch WhatsApp Direct
                    </a>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 [&>*]:min-w-0 gap-3 text-sm">
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-3 bg-muted hover:bg-muted border border-border rounded-xl transition-all font-semibold text-foreground flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-info" /> Call {lead.phone}
                    </a>
                    <a
                      href={`mailto:${lead.email}`}
                      className="p-3 bg-muted hover:bg-muted border border-border rounded-xl transition-all font-semibold text-foreground flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-foreground" /> Email {lead.email || "Lead"}
                    </a>
                  </div>
                </div>

                {/* Timeline & BDE Notes Card */}
                <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-2xs">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" /> Executive Activity Timeline & Notes ({notesList.length})
                  </h3>

                  {/* Add New Note Input */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add BDE call note, discovery outcome, or follow-up task..."
                      className="w-full text-sm font-semibold p-3 rounded-xl border border-input outline-none focus:border-success bg-muted"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote || !newNoteContent.trim()}
                        className="px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-success" />}
                        Post Activity Note
                      </button>
                    </div>
                  </form>

                  {/* Notes Feed Stream */}
                  <div className="space-y-3 pt-2 max-h-80 overflow-y-auto">
                    {notesList.length === 0 ? (
                      <p className="text-center text-sm font-semibold text-muted-foreground py-6">
                        No activity notes logged yet. Post the first call outcome above!
                      </p>
                    ) : (
                      notesList.map((n) => (
                        <div key={n._id} className="p-3.5 bg-muted rounded-xl border border-border space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">
                              {n.senderName || "BDE / System"}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground font-medium whitespace-pre-wrap">
                            {n.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="bg-card p-5 rounded-2xl border border-border space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">WhatsApp Messaging Console</h3>
                  <p className="text-xs text-muted-foreground">Connected to Meta Cloud API (+91 7304056607)</p>
                </div>
                <a
                  href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary transition-all flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Launch WhatsApp App
                </a>
              </div>

              <div className="p-4 rounded-xl bg-muted text-sm text-muted-foreground space-y-2 border border-border">
                <p className="font-semibold text-foreground">Quick Template Messages:</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1.5 bg-card border border-input rounded-lg font-medium hover:border-success cursor-pointer">
                    Welcome Ping
                  </button>
                  <button className="px-3 py-1.5 bg-card border border-input rounded-lg font-medium hover:border-success cursor-pointer">
                    Schedule Discovery Call
                  </button>
                  <button className="px-3 py-1.5 bg-card border border-input rounded-lg font-medium hover:border-success cursor-pointer">
                    Send Proposal PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Add Note Input Form */}
              <form onSubmit={handleAddNote} className="bg-card p-5 rounded-2xl border border-border space-y-3 shadow-2xs">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-success" /> Add BDE Activity Note / Call Log
                </h3>

                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Record call discussion, client feedback, budget updates, or next step..."
                  className="w-full text-sm font-semibold p-3 rounded-xl border border-border outline-none focus:border-success bg-muted focus:bg-card transition-all"
                  required
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingNote || !newNoteContent.trim()}
                    className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-foreground disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
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
              <div className="bg-card p-5 rounded-2xl border border-border space-y-4 shadow-2xs">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Workflow Timeline & Step-by-Step Audit Logs
                </h3>

                {isLoadingNotes ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-success" />
                    Loading activity timeline...
                  </div>
                ) : notesList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-muted text-sm text-muted-foreground text-center">
                    No activity notes recorded yet. Add your first note above!
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                    {notesList.map((msg, idx) => {
                      const isSystem = msg.channel === "SYSTEM_NOTE";

                      return (
                        <div key={msg._id || idx} className="relative pl-8 text-sm space-y-1">
                          <div className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 bg-card ${isSystem ? "border-info" : "border-success"}`} />

                          <div className="p-3.5 rounded-xl bg-muted border border-border space-y-1">
                            <div className="flex items-center justify-between text-muted-foreground font-semibold text-xs">
                              <span className={`font-semibold ${isSystem ? "text-info" : "text-success"}`}>
                                {isSystem ? "⚙️ System Workflow Log" : `${msg.senderInfo?.name || "BDE Note"}`}
                              </span>
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-foreground font-medium whitespace-pre-wrap leading-relaxed">
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
            <div className="bg-card p-5 rounded-2xl border border-border space-y-4 text-center py-12">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No attached proposals or invoices yet</p>
              <p className="text-xs text-muted-foreground">
                Uploaded PDFs, proposals, and studio shoot previews will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
      {deleteOpen && (
        <ConfirmDialog
          title={`Delete ${lead.fullName || "this lead"}?`}
          message="The lead and its notes are removed for good. This cannot be undone."
          confirmLabel="Delete lead"
          cancelLabel="Keep lead"
          onConfirm={() => {
            setDeleteOpen(false);
            handleDeleteLead();
          }}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}
