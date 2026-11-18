"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, ChatCircle as MessageCircle, Envelope as Mail, Phone, Building, CurrencyDollar as DollarSign, Medal as Award, Tag, Clock, PaperPlaneTilt as Send, FileText, Paperclip, CheckCircle as CheckCircle2, WarningCircle as AlertCircle, User as UserIcon, ShieldWarning as ShieldAlert } from "@phosphor-icons/react";
import { formatDistanceToNow, format } from "date-fns";

interface LeadDetailClientProps {
  leadId: string;
}

const STAGES = [
  { id: "new-lead", name: "New Lead" },
  { id: "contacted", name: "Contacted" },
  { id: "discovery-call", name: "Discovery Call" },
  { id: "proposal-sent", name: "Proposal Sent" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed-won", name: "Closed Won" },
  { id: "closed-lost", name: "Closed Lost" },
];

export default function LeadDetailClient({ leadId }: LeadDetailClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lead, setLead] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [messages, setMessages] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [files, setFiles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "activity" | "whatsapp" | "gmail" | "files" | "notes"
  >("activity");

  const [isLoading, setIsLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [isSendingNote, setIsSendingNote] = useState(false);

  const fetchLeadDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`/api/v1/leads/${leadId}`);
      setLead(res.data.lead);
      setMessages(res.data.messages || []);
      setFiles(res.data.files || []);
    } catch (error) {
      console.error("Failed to fetch lead details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  const handleStageChange = async (newStageId: string) => {
    try {
      const res = await axios.patch(`/api/v1/leads/${leadId}/stage`, {
        stageId: newStageId,
      });
      setLead(res.data.lead);
      fetchLeadDetails();
    } catch (error) {
      console.error("Failed to change stage:", error);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    try {
      setIsSendingNote(true);
      await axios.post(`/api/v1/leads/${leadId}/notes`, {
        content: noteContent,
      });
      setNoteContent("");
      fetchLeadDetails();
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSendingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
          <div className="w-5 h-5 border-2 border-(--color-brand-green) border-t-transparent rounded-full animate-spin" />
          Loading lead profile...
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-input shadow-xs">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <h2 className="text-base font-semibold text-foreground">Lead Record Not Found</h2>
        <p className="text-sm font-semibold text-muted-foreground mt-1">
          The requested opportunity record does not exist or has been removed.
        </p>
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-(--color-brand-green) hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-(--color-brand-green) transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sales Pipeline
        </Link>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-primary hover:bg-primary transition-colors shadow-2xs"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Chat
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl bg-info hover:bg-info transition-colors shadow-2xs"
          >
            <Mail className="w-4 h-4" /> Send Email
          </a>
        </div>
      </div>

      {/* Main Opportunity Header Bar */}
      <div
        className="p-6 bg-card rounded-2xl border border-input flex flex-wrap items-center justify-between gap-5 shadow-xs"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-xl shadow-xs"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            {(lead.fullName || lead.phone || "L").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                {lead.fullName}
              </h1>
              <span className="text-sm font-mono font-semibold px-2.5 py-0.5 rounded bg-muted border border-input text-foreground">
                {lead.leadCustomId}
              </span>
              <span
                className="flex items-center gap-1 text-sm font-semibold px-3 py-0.5 rounded-full border border-warning"
                style={{
                  backgroundColor: "var(--color-brand-mustard-bg)",
                  color: "var(--color-brand-mustard)",
                }}
              >
                <Award className="w-3.5 h-3.5" />
                Score: {lead.score} pts
              </span>
            </div>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Ingested {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">
            Pipeline Stage:
          </span>
          <select
            value={lead.stageId}
            onChange={(e) => handleStageChange(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-input bg-muted text-(--color-brand-green) outline-none cursor-pointer hover:border-input transition-colors"
          >
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Layout: Contact Info & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Contact Info Card */}
        <div className="space-y-4">
          <div
            className="p-6 bg-card rounded-2xl border border-input space-y-5 shadow-xs"
          >
            <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">
              Lead Contact Details
            </h2>

            <div className="space-y-3.5 text-sm font-semibold">
              <div className="flex items-center gap-3 text-foreground">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground truncate">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{lead.phone}</span>
              </div>
              {lead.companyName && (
                <div className="flex items-center gap-3 text-foreground">
                  <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-semibold">{lead.companyName}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-foreground">
                <DollarSign className="w-4 h-4 text-success shrink-0" />
                <span className="font-semibold text-(--color-brand-green) text-sm">
                  ${(lead.estimatedBudget || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  Assigned BDE:{" "}
                  <strong className="text-foreground font-semibold">
                    {lead.assignedTo?.name || "Unassigned"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Tagged Services */}
            {lead.interestedServices?.length > 0 && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Interested Services
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lead.interestedServices.map((srv: string) => (
                    <span
                      key={srv}
                      className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg bg-(--color-brand-green-light) text-(--color-brand-green)"
                    >
                      <Tag className="w-3 h-3" />
                      {srv.replace("-", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements Message */}
            {lead.requirementsMessage && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-1.5">
                  Requirements & Notes
                </p>
                <div className="p-3 rounded-xl bg-muted border border-border text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                  {lead.requirementsMessage}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tabbed Timeline Container */}
        <div className="lg:col-span-2 space-y-4">
          <div
            className="bg-card rounded-2xl border border-input min-h-[520px] flex flex-col shadow-xs"
          >
            {/* Tab Navigation Header */}
            <div className="flex border-b border-border px-5 pt-3 gap-2 overflow-x-auto bg-muted rounded-t-2xl">
              {[
                { id: "activity", label: "Activity Timeline", icon: Clock },
                { id: "whatsapp", label: "WhatsApp Thread", icon: MessageCircle },
                { id: "gmail", label: "Gmail Sync", icon: Mail },
                { id: "files", label: "Files", icon: Paperclip },
                { id: "notes", label: "Internal Notes", icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "border-(--color-brand-green) text-(--color-brand-green) bg-card rounded-t-xl"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Tab 1: Activity Timeline */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  {/* Quick Note Input Bar inside Timeline */}
                  <form onSubmit={handleAddNote} className="p-3 bg-muted border border-border rounded-xl flex gap-2 mb-4">
                    <input
                      type="text"
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Type a quick executive note or update..."
                      className="flex-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-input bg-card outline-none focus:border-(--color-brand-green)"
                    />
                    <button
                      type="submit"
                      disabled={isSendingNote || !noteContent.trim()}
                      className="px-4 py-1.5 text-sm font-semibold text-white rounded-lg shadow-2xs cursor-pointer disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-brand-green)" }}
                    >
                      Add Note
                    </button>
                  </form>

                  {messages.length === 0 ? (
                    <div className="text-center py-16 text-sm font-semibold text-muted-foreground">
                      No activity logs recorded for this lead yet.
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className="flex gap-3.5 text-sm p-4 rounded-xl border border-border bg-muted"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-2xs mt-0.5"
                          style={{
                            backgroundColor:
                              msg.channel === "WHATSAPP"
                                ? "var(--color-status-success)"
                                : msg.channel === "GMAIL"
                                ? "var(--color-status-info)"
                                : "var(--color-brand-green)",
                          }}
                        >
                          {msg.channel === "WHATSAPP" ? (
                            <MessageCircle className="w-4 h-4" />
                          ) : msg.channel === "GMAIL" ? (
                            <Mail className="w-4 h-4" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-semibold text-foreground">
                              {msg.channel === "SYSTEM_NOTE"
                                ? `Executive Note by ${msg.senderInfo?.name || "BDE"}`
                                : `${msg.channel} · ${msg.direction}`}
                            </span>
                            <span className="text-sm font-semibold text-muted-foreground">
                              {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: WhatsApp Chat */}
              {activeTab === "whatsapp" && (
                <div className="flex flex-col h-full min-h-[380px] justify-between">
                  <div className="space-y-3">
                    <div className="p-4 bg-success-soft border border-border rounded-xl text-sm font-semibold text-success flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-success shrink-0" />
                      WhatsApp Business Cloud API Connector Active for {lead.fullName} ({lead.phone}).
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 pt-4 border-t border-border">
                    <input
                      type="text"
                      placeholder="Type a WhatsApp message..."
                      className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-input outline-none focus:border-(--color-brand-green)"
                    />
                    <button
                      className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs"
                      style={{ backgroundColor: "var(--color-status-success)" }}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Gmail Sync */}
              {activeTab === "gmail" && (
                <div className="text-center py-16 text-sm font-semibold text-muted-foreground space-y-2">
                  <Mail className="w-8 h-8 text-info mx-auto" />
                  <p>Gmail OAuth2 sync listener configured for {lead.email}.</p>
                </div>
              )}

              {/* Tab 4: Files */}
              {activeTab === "files" && (
                <div className="space-y-3">
                  {files.length === 0 ? (
                    <div className="text-center py-16 text-sm font-semibold text-muted-foreground">
                      No document assets attached to this lead record.
                    </div>
                  ) : (
                    files.map((f) => (
                      <div
                        key={f._id}
                        className="flex items-center justify-between p-4 rounded-xl border border-input bg-muted"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-5 h-5 text-(--color-brand-green)" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {f.fileName}
                            </p>
                            <p className="text-sm font-semibold text-muted-foreground">
                              {(f.fileSize / 1024).toFixed(1)} KB · {f.accessLevel}
                            </p>
                          </div>
                        </div>
                        <a
                          href={f.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-(--color-brand-green) hover:underline"
                        >
                          Download Asset
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 5: Internal Notes */}
              {activeTab === "notes" && (
                <div className="space-y-5">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      rows={3}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Add an internal note about this opportunity..."
                      className="w-full p-4 text-sm font-medium rounded-xl border border-input bg-muted focus:bg-card focus:border-(--color-brand-green) outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSendingNote || !noteContent.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                        style={{ backgroundColor: "var(--color-brand-green)" }}
                      >
                        <Send className="w-3.5 h-3.5" /> Post Internal Note
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 pt-4 border-t border-border">
                    {messages
                      .filter((m) => m.channel === "SYSTEM_NOTE")
                      .map((n) => (
                        <div
                          key={n._id}
                          className="p-4 rounded-xl border border-border bg-muted text-sm"
                        >
                          <div className="flex justify-between font-semibold text-muted-foreground mb-1.5">
                            <span>{n.senderInfo?.name || "System Note"}</span>
                            <span>{format(new Date(n.createdAt), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-foreground font-medium whitespace-pre-wrap leading-relaxed">
                            {n.content}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
