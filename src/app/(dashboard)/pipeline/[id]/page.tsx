"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Buildings, Envelope, Phone, MapPin, CalendarBlank, Clock, PaperPlaneTilt, ChatText, Warning, UserCheck, PencilSimple, FloppyDisk, SpinnerGap, Trash, Check, WhatsappLogo } from "@phosphor-icons/react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
import {
  TitepoSpecsCard,
  TzarSpecsCard,
  AdshalaaSpecsCard,
  CrownleafSpecsCard,
} from "@/components/leads/brand-specs";

const BRAND_CONFIG: Record<BusinessSlug, { label: string; logo: string }> = {
  tzar: { label: "Tzar Digital Agency", logo: "/tzar-logo.png" },
  adshalaa: { label: "Adshalaa Edutech", logo: "/adshalaa-logo.png" },
  crownleaf: { label: "Crownleaf Luxury Gifting", logo: "/Crownleaf-logo.png" },
  titepo: { label: "Titepo", logo: "/titepo-logo.png" },
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

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
        setNotice({ kind: "ok", text: `${lead.fullName} is now a client.` });
        setLead((prev) => (prev ? { ...prev, status: "CONVERTED" } : null));
      } else {
        setNotice({ kind: "error", text: data.error || "Could not convert this lead." });
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
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/leads/${lead._id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/pipeline");
      } else {
        setNotice({ kind: "error", text: "Could not delete this lead." });
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
        <SpinnerGap className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (errorMsg || !lead) {
    return (
      <div className="mx-auto my-12 max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-xs">
        <p className="text-base font-semibold text-foreground">{errorMsg || "Lead not found"}</p>
        <button
          onClick={() => router.push("/pipeline")}
          className="mt-4 h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover cursor-pointer"
        >
          Back to pipeline
        </button>
      </div>
    );
  }

  const currentBrand = BRAND_CONFIG[(lead.business || "tzar") as BusinessSlug] || BRAND_CONFIG.tzar;
  const isOverdue = lead.slaDeadline ? new Date(lead.slaDeadline) < new Date() : false;
  const currentStageId = lead.stageId || "new-lead";
  const currentIdx = STAGES.findIndex((st) => st.id === currentStageId);
  const submitted = lead.createdAt ? new Date(lead.createdAt) : null;

  const card = "rounded-xl border border-border bg-card p-5 shadow-xs";
  const cardTitle = "text-base font-semibold text-foreground";
  const fieldLabel = "text-sm text-muted-foreground";
  const fieldValue = "mt-0.5 text-sm font-medium text-foreground break-words";
  const outlineButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer";
  const primaryButton =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12 animate-fade-in">
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${
            notice.kind === "ok" ? "border-success bg-success-soft text-success" : "border-destructive bg-destructive-soft text-destructive"
          }`}
        >
          {notice.text}
          <button onClick={() => setNotice(null)} className="text-sm underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Header: who the lead is, what to do with it, and where it is in the pipeline */}
      <section className={card + " space-y-5"}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/pipeline")}
              className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg border border-input bg-card text-foreground hover:bg-muted cursor-pointer"
              aria-label="Back to pipeline"
              title="Back to pipeline"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="font-mono font-semibold text-foreground">{lead.leadCustomId || "New lead"}</span>
                {currentBrand.logo ? (
                  <img src={currentBrand.logo} alt={currentBrand.label} className="h-6 w-auto max-w-[120px] object-contain" />
                ) : (
                  <span className="font-medium text-foreground">{currentBrand.label}</span>
                )}
                {isOverdue ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
                    <Warning size={16} weight="fill" /> SLA overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={16} /> Within SLA
                  </span>
                )}
              </div>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{lead.fullName || "Unnamed lead"}</h1>
              {lead.companyName && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Buildings size={16} /> {lead.companyName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleConvertToClient}
              disabled={isConverting || lead.status === "CONVERTED"}
              className={lead.status === "CONVERTED" ? outlineButton + " cursor-default" : primaryButton}
            >
              {isConverting ? <SpinnerGap size={18} className="animate-spin" /> : lead.status === "CONVERTED" ? <Check size={18} /> : <UserCheck size={18} />}
              {lead.status === "CONVERTED" ? "Converted to client" : "Convert to client"}
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
                className="grid size-10 place-items-center rounded-lg border border-input bg-card text-destructive hover:bg-destructive-soft cursor-pointer"
                title="Delete lead"
                aria-label="Delete lead"
              >
                {isDeleting ? <SpinnerGap size={18} className="animate-spin" /> : <Trash size={18} />}
              </button>
            )}
          </div>
        </div>

        <div>
          <p className={fieldLabel + " mb-2"}>Stage</p>
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {STAGES.map((stg, idx) => {
              const isCurrent = idx === currentIdx;
              const isPast = idx < currentIdx;
              return (
                <li key={stg.id}>
                  <button
                    onClick={() => handleUpdateStage(stg.id)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition-colors cursor-pointer ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground"
                        : isPast
                        ? "border-input bg-muted text-foreground hover:bg-border"
                        : "border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    title={`Move this lead to ${stg.name}`}
                  >
                    {isPast && <Check size={14} weight="bold" />}
                    <span className="truncate">{stg.name}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <section className={card + " space-y-4"}>
            <h2 className={cardTitle}>Contact details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className={fieldLabel}>Email</dt>
                <dd className={fieldValue}>
                  <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Envelope size={16} className="shrink-0 text-muted-foreground" /> {lead.email || "Not given"}
                  </a>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={fieldLabel}>Phone</dt>
                <dd className={fieldValue}>
                  <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Phone size={16} className="shrink-0 text-muted-foreground" /> {lead.phone || "Not given"}
                  </a>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={fieldLabel}>Location</dt>
                <dd className={fieldValue}>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={16} className="shrink-0 text-muted-foreground" />
                    {lead.city || lead.titepoData?.streetAddress || [lead.country].filter(Boolean).join(", ") || "Not given"}
                  </span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className={fieldLabel}>Received</dt>
                <dd className={fieldValue}>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarBlank size={16} className="shrink-0 text-muted-foreground" />
                    {submitted ? submitted.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Unknown"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          {lead.business === "titepo" && <TitepoSpecsCard lead={lead} />}
          {lead.business === "tzar" && <TzarSpecsCard lead={lead} />}
          {lead.business === "adshalaa" && <AdshalaaSpecsCard lead={lead} />}
          {lead.business === "crownleaf" && <CrownleafSpecsCard lead={lead} />}

          {lead.metaFormFields && lead.metaFormFields.length > 0 && (
            <section className={card + " space-y-3"}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className={cardTitle}>Facebook form answers</h2>
                <span className="text-sm text-muted-foreground">{lead.metaFormFields.length} answers</span>
              </div>
              <dl className="divide-y divide-border">
                {lead.metaFormFields.map((field, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <dt className={fieldLabel + " capitalize"}>{field.label}</dt>
                    <dd className={fieldValue}>{field.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className={card + " space-y-4"}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={cardTitle}>Deal value and requirements</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className={outlineButton + " h-9 px-3"}>
                  <PencilSimple size={16} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)} className={outlineButton + " h-9 px-3"}>
                    Cancel
                  </button>
                  <button onClick={handleSaveDetails} disabled={isSavingDetails} className={primaryButton + " h-9 px-3"}>
                    {isSavingDetails ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <dl className="space-y-3">
                <div>
                  <dt className={fieldLabel}>Estimated budget</dt>
                  <dd className="text-xl font-semibold text-foreground">₹{(lead.estimatedBudget || 0).toLocaleString("en-IN")}</dd>
                </div>
                {lead.requirementsMessage && (
                  <div>
                    <dt className={fieldLabel}>Requirement notes</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{lead.requirementsMessage}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="budget" className="text-sm font-medium text-foreground">
                    Estimated budget (₹)
                  </label>
                  <input
                    id="budget"
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="req" className="text-sm font-medium text-foreground">
                    Requirement notes
                  </label>
                  <textarea
                    id="req"
                    rows={3}
                    value={requirementsInput}
                    onChange={(e) => setRequirementsInput(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
                  />
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5 lg:col-span-7">
          <section className={card + " space-y-4"}>
            <h2 className={cardTitle}>Contact this lead</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <a
                href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hello ${lead.fullName || ""}, thank you for contacting ${currentBrand.label}.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className={primaryButton}
              >
                <WhatsappLogo size={18} /> WhatsApp
              </a>
              <a href={`tel:${lead.phone}`} className={outlineButton}>
                <Phone size={18} /> Call
              </a>
              <a href={`mailto:${lead.email}`} className={outlineButton}>
                <Envelope size={18} /> Email
              </a>
            </div>
          </section>

          <section className={card + " space-y-4"}>
            <h2 className={cardTitle + " flex items-center gap-2"}>
              <ChatText size={18} className="text-muted-foreground" /> Activity notes ({notesList.length})
            </h2>

            <form onSubmit={handleAddNote} className="space-y-2">
              <label htmlFor="note" className="sr-only">
                New note
              </label>
              <textarea
                id="note"
                rows={3}
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write what happened on the call, or what to do next"
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
              />
              <div className="flex justify-end">
                <button type="submit" disabled={isSubmittingNote || !newNoteContent.trim()} className={primaryButton}>
                  {isSubmittingNote ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneTilt size={16} />}
                  Add note
                </button>
              </div>
            </form>

            <ul className="max-h-[450px] divide-y divide-border overflow-y-auto">
              {notesList.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">No notes yet. Add the first one above.</li>
              ) : (
                notesList.map((n) => (
                  <li key={n._id} className="py-3 first:pt-0">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-semibold text-foreground">{n.senderName || "Team member"}</span>
                      <span className="text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Just now"}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{n.content}</p>
                  </li>
                ))
              )}
            </ul>
          </section>
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
