"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { ILead, BusinessSlug } from "@/models/Lead";

interface LeadWorkspaceDrawerProps {
  lead: Partial<ILead> | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedFields: Partial<ILead>) => void;
}

export function LeadWorkspaceDrawer({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
}: LeadWorkspaceDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "activity" | "files">("overview");
  const [noteText, setNoteText] = useState("");

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

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "activity"
                ? "border-(--color-brand-green) text-(--color-brand-green)"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Timeline & Activity Log
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

              {/* Requirements & Budget Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Lead Interest & Value
                  </h3>

                  {lead.estimatedBudget ? (
                    <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                      ₹{lead.estimatedBudget.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">Unbudgeted</span>
                  )}
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Lead Activity & Note Logs
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <span>System Ingestion</span>
                    <span>{new Date(lead.createdAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-900 font-semibold">
                    Lead created for [{business.toUpperCase()}] via {lead.source}
                  </p>
                </div>
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
