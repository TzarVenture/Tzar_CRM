"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  Building2,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  Send,
  MoreVertical,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  BookOpen,
  Gift,
  ShoppingBag,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Zap,
  Facebook,
} from "lucide-react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import { LeadWorkspaceDrawer } from "./LeadWorkspaceDrawer";
import { CreateLeadModal } from "./CreateLeadModal";

interface SmartLeadGridProps {
  initialLeads: Partial<ILead>[];
}

const BRAND_CONFIG: Record<
  "all" | BusinessSlug,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  all: { label: "All Businesses", bg: "bg-slate-900", text: "text-white", border: "border-slate-800", icon: Layers },
  tzar: { label: "Tzar Agency", bg: "bg-emerald-700", text: "text-white", border: "border-emerald-800", icon: Briefcase },
  adshalaa: { label: "Adshalaa EdTech", bg: "bg-blue-700", text: "text-white", border: "border-blue-800", icon: BookOpen },
  crownleaf: { label: "CrownLeaf Gifting", bg: "bg-amber-600", text: "text-white", border: "border-amber-700", icon: Gift },
  titepo: { label: "Titepo Toys", bg: "bg-pink-600", text: "text-white", border: "border-pink-700", icon: ShoppingBag },
};

const STAGES: { id: KanbanStage; name: string; color: string }[] = [
  { id: "new-lead", name: "New Lead", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { id: "contacted", name: "Contacted", color: "bg-purple-100 text-purple-800 border-purple-200" },
  { id: "discovery-call", name: "Discovery Call", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { id: "proposal-sent", name: "Proposal Sent", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { id: "negotiation", name: "Negotiation", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { id: "closed-won", name: "Closed Won", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { id: "closed-lost", name: "Closed Lost", color: "bg-rose-100 text-rose-800 border-rose-200" },
];

export function SmartLeadGrid({ initialLeads }: SmartLeadGridProps) {
  const [leads, setLeads] = useState<Partial<ILead>[]>(initialLeads);
  const [selectedBrand, setSelectedBrand] = useState<"all" | BusinessSlug>("all");
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Partial<ILead> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // 5-Second Real-Time Auto-Polling Engine
  useEffect(() => {
    const fetchLatestLeads = async () => {
      try {
        setIsLiveSyncing(true);
        const res = await fetch(`/api/v1/leads?business=${selectedBrand}`);
        if (res.ok) {
          const data = await res.json();
          if (data.leads) {
            setLeads(data.leads);
          }
        }
      } catch (err) {
        console.error("Live Polling Error:", err);
      } finally {
        setTimeout(() => setIsLiveSyncing(false), 600);
      }
    };

    // Auto-fetch every 5 seconds for instant real-time intake
    const interval = setInterval(fetchLatestLeads, 5000);
    return () => clearInterval(interval);
  }, [selectedBrand]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Business Filter
      if (selectedBrand !== "all" && lead.business !== selectedBrand) return false;

      // 2. Stage Filter
      if (selectedStageFilter !== "all" && lead.stageId !== selectedStageFilter) return false;

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (lead.fullName || "").toLowerCase().includes(q);
        const emailMatch = (lead.email || "").toLowerCase().includes(q);
        const phoneMatch = (lead.phone || "").toLowerCase().includes(q);
        const customIdMatch = (lead.leadCustomId || "").toLowerCase().includes(q);
        const companyMatch = (lead.companyName || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || customIdMatch || companyMatch;
      }

      return true;
    });
  }, [leads, selectedBrand, selectedStageFilter, searchQuery]);

  // Stage Metrics Calculations
  const stageMetrics = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    STAGES.forEach((s) => {
      counts[s.id] = { count: 0, value: 0 };
    });

    const relevantLeads = selectedBrand === "all" ? leads : leads.filter((l) => l.business === selectedBrand);

    relevantLeads.forEach((l) => {
      if (counts[l.stageId || "new-lead"]) {
        counts[l.stageId || "new-lead"].count += 1;
        counts[l.stageId || "new-lead"].value += l.estimatedBudget || 0;
      }
    });

    return counts;
  }, [leads, selectedBrand]);

  const handleStageChange = async (leadId: string, newStage: KanbanStage) => {
    setLeads((prev) =>
      prev.map((l) => (l._id?.toString() === leadId ? { ...l, stageId: newStage } : l))
    );

    try {
      await fetch(`/api/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: newStage }),
      });
    } catch (err) {
      console.error("Failed to update lead stage:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 1. BRAND SWITCHER BAR ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Centralized Leads Data Grid
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
              <Zap className={`w-3 h-3 text-emerald-600 ${isLiveSyncing ? "animate-spin" : ""}`} />
              Live Sync 5s
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            Unified workspace consolidating leads across all 4 Tzar Group entities (Auto-refreshes every 5s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Lead
          </button>
        </div>

        {/* Brand Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl border border-slate-300">
          {(["all", "tzar", "adshalaa", "crownleaf", "titepo"] as const).map((bSlug) => {
            const config = BRAND_CONFIG[bSlug];
            const Icon = config.icon;
            const isSelected = selectedBrand === bSlug;

            return (
              <button
                key={bSlug}
                onClick={() => setSelectedBrand(bSlug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? `${config.bg} ${config.text} shadow-xs`
                    : "text-slate-700 hover:bg-slate-300/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. STAGE KPI SUMMARY CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAGES.map((s) => {
          const metrics = stageMetrics[s.id] || { count: 0, value: 0 };
          const isActive = selectedStageFilter === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setSelectedStageFilter(isActive ? "all" : s.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                  : "bg-white text-slate-800 border-slate-300 hover:border-slate-400 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                  {s.name}
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}>
                  {metrics.count}
                </span>
              </div>
              <p className={`text-sm font-extrabold ${isActive ? "text-emerald-400" : "text-slate-900"}`}>
                ₹{metrics.value.toLocaleString()}
              </p>
            </button>
          );
        })}
      </div>

      {/* ─── 3. SEARCH & CONTROLS TOOLBAR ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-300 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by lead name, phone, email, company, custom ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-(--color-brand-green) focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedStageFilter !== "all" && (
            <button
              onClick={() => setSelectedStageFilter("all")}
              className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
            >
              Clear Stage Filter
            </button>
          )}

          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            Showing {filteredLeads.length} leads
          </span>
        </div>
      </div>

      {/* ─── 4. HIGH-DENSITY SMART DATA GRID ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Lead ID</th>
                <th className="py-3.5 px-4">Brand Entity</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Interest / Program</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">SLA Status</th>
                <th className="py-3.5 px-4">Stage Status</th>
                <th className="py-3.5 px-4">Est. Budget</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-semibold">
                    No leads found matching current search or filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const bSlug = (lead.business || "tzar") as BusinessSlug;
                  const bConfig = BRAND_CONFIG[bSlug] || BRAND_CONFIG.tzar;
                  const BIcon = bConfig.icon;
                  const isOverdue = lead.slaDeadline ? new Date(lead.slaDeadline) < new Date() : false;
                  const currentStageObj = STAGES.find((s) => s.id === lead.stageId) || STAGES[0];

                  return (
                    <tr
                      key={lead._id?.toString() || lead.leadCustomId}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => setSelectedLeadForDrawer(lead)}
                    >
                      {/* Lead Custom ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {lead.leadCustomId}
                      </td>

                      {/* Brand Entity Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${bConfig.bg} ${bConfig.text}`}>
                          <BIcon className="w-3 h-3" />
                          {bConfig.label}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="font-bold text-slate-900 group-hover:text-(--color-brand-green) transition-colors">
                          {lead.fullName}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span>{lead.phone}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{lead.email}</span>
                        </div>
                      </td>

                      {/* Interest / Course */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {lead.interestedServices && lead.interestedServices.length > 0 ? (
                          <span className="truncate max-w-[180px] inline-block font-semibold">
                            {lead.interestedServices.join(", ")}
                          </span>
                        ) : (
                          <span className="text-slate-400">General Inquiry</span>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        {lead.source === "META_LEAD_AD" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-[#1877F2] text-white shadow-2xs border border-blue-700">
                            <Facebook className="w-3.5 h-3.5 fill-white text-white" /> META_LEAD_AD
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {lead.source}
                          </span>
                        )}
                      </td>

                      {/* SLA Status */}
                      <td className="py-3.5 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <Clock className="w-3 h-3" /> Active SLA
                          </span>
                        )}
                      </td>

                      {/* Stage Selector */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.stageId || "new-lead"}
                          onChange={(e) =>
                            handleStageChange(lead._id!.toString(), e.target.value as KanbanStage)
                          }
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border outline-hidden transition-all cursor-pointer ${currentStageObj.color}`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Est Budget */}
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="WhatsApp Chat"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setSelectedLeadForDrawer(lead)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Open Workspace Drawer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. SLIDE-OVER LEAD WORKSPACE DRAWER ─────────────────────────── */}
      <LeadWorkspaceDrawer
        lead={selectedLeadForDrawer}
        isOpen={!!selectedLeadForDrawer}
        onClose={() => setSelectedLeadForDrawer(null)}
        onUpdateLead={(updated) => {
          if (!selectedLeadForDrawer?._id) return;
          setLeads((prev) =>
            prev.map((l) =>
              l._id === selectedLeadForDrawer._id ? { ...l, ...updated } : l
            )
          );
        }}
        onDeleteLead={(deletedId) => {
          setLeads((prev) => prev.filter((l) => l._id?.toString() !== deletedId));
          setSelectedLeadForDrawer(null);
        }}
      />

      {/* Manual Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={(newLead) => {
          if (newLead) {
            setLeads((prev) => [newLead, ...prev.filter((l) => l._id?.toString() !== newLead._id?.toString())]);
          }
          fetch(`/api/v1/leads?business=${selectedBrand}`)
            .then((res) => res.json())
            .then((data) => data.leads && setLeads(data.leads));
        }}
      />
    </div>
  );
}
