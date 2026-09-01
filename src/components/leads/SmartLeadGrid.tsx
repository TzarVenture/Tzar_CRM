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
  Download,
  Loader2,
  X,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import { LeadWorkspaceDrawer } from "./LeadWorkspaceDrawer";
import { CreateLeadModal } from "./CreateLeadModal";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

interface SmartLeadGridProps {
  initialLeads: Partial<ILead>[];
}

const BRAND_CONFIG: Record<
  "all" | BusinessSlug,
  { label: string; bg: string; text: string; border: string; icon: any; logo: string }
> = {
  all: { label: "All Businesses", bg: "bg-slate-900", text: "text-white", border: "border-slate-800", icon: Layers, logo: "" },
  tzar: { label: "Tzar Agency", bg: "bg-[#0d4733]", text: "text-white", border: "border-[#083022]", icon: Briefcase, logo: "/tzar-logo.png" },
  adshalaa: { label: "Adshalaa EdTech", bg: "bg-[#0d4733]", text: "text-white", border: "border-[#083022]", icon: BookOpen, logo: "/adshalaa-logo.png" },
  crownleaf: { label: "CrownLeaf Gifting", bg: "bg-[#0d4733]", text: "text-white", border: "border-[#083022]", icon: Gift, logo: "/Crownleaf-logo.png" },
  titepo: { label: "Titepo Toys", bg: "bg-[#0d4733]", text: "text-white", border: "border-[#083022]", icon: ShoppingBag, logo: "/titepo-logo.png" },
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
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedBusinesses = useMemo<string[]>(() => {
    return (session?.user as any)?.allowedBusinesses || ["tzar", "titepo", "adshalaa", "crownleaf"];
  }, [session]);

  const availableBrands = useMemo(() => {
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") {
      return ["all", "tzar", "adshalaa", "crownleaf", "titepo"] as const;
    }
    const filtered = (["tzar", "adshalaa", "crownleaf", "titepo"] as const).filter((b) =>
      allowedBusinesses.includes(b)
    );
    return ["all", ...filtered];
  }, [userRole, allowedBusinesses]);

  const [leads, setLeads] = useState<Partial<ILead>[]>(initialLeads);
  const [selectedBrand, setSelectedBrand] = useState<"all" | BusinessSlug>("all");

  useEffect(() => {
    if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      if (selectedBrand !== "all" && !allowedBusinesses.includes(selectedBrand)) {
        setSelectedBrand("all");
      }
    }
  }, [selectedBrand, allowedBusinesses, userRole]);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLeadForDrawer, setSelectedLeadForDrawer] = useState<Partial<ILead> | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // Pro-Level Filtering States
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [slaFilter, setSlaFilter] = useState<string>("all");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvBusiness, setCsvBusiness] = useState<BusinessSlug>("tzar");
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvResultMsg, setCsvResultMsg] = useState<string | null>(null);

  const handleCsvUploadGrid = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCsv(true);
    setCsvResultMsg(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawText = event.target?.result as string;
        const cleanedText = rawText.replace(/\0/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        const lines = cleanedText.split("\n").filter((l) => l.trim().length > 0);

        if (lines.length < 2) {
          setCsvResultMsg("Error: CSV file appears to be empty.");
          setIsUploadingCsv(false);
          return;
        }

        // Auto-detect delimiter (Tab vs Comma)
        const delimiter = lines[0].includes("\t") ? "\t" : ",";

        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = "";
          let inQuotes = false;
          for (let k = 0; k < line.length; k++) {
            const char = line[k];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ""));
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ""));
          return result;
        };

        const headers = parseLine(lines[0]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records: any[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseLine(lines[i]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record: any = {};
          headers.forEach((header, index) => {
            record[header] = values[index] || "";
          });
          records.push(record);
        }

        const res = await fetch("/api/v1/meta/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leads: records,
            business: csvBusiness,
          }),
        }).then((r) => r.json());

        if (res.message) {
          setCsvResultMsg(res.message);
          const updated = await fetch(`/api/v1/leads?business=${selectedBrand}`).then((r) => r.json());
          if (updated.leads) setLeads(updated.leads);
        } else {
          setCsvResultMsg(`Error: ${res.error || "Failed to import CSV leads"}`);
        }
      } catch (err: any) {
        console.error("CSV Import error:", err);
        setCsvResultMsg(`Error: ${err.message}`);
      } finally {
        setIsUploadingCsv(false);
      }
    };

    reader.readAsText(file);
  };

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

    // Auto-fetch immediately on tab switch + poll every 5 seconds for instant real-time intake
    fetchLatestLeads();
    const interval = setInterval(fetchLatestLeads, 5000);
    return () => clearInterval(interval);
  }, [selectedBrand]);

  // Pro Multi-Level Filtered Leads
  const filteredLeads = useMemo(() => {
    const now = new Date();

    return leads.filter((lead) => {
      // 0. Strict RBAC Business Access Scoping for Non-Admins
      if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        if (!allowedBusinesses.includes(lead.business || "")) return false;
      }

      // 1. Business Brand Filter
      if (selectedBrand !== "all" && lead.business !== selectedBrand) return false;

      // 2. Stage Status Filter
      if (selectedStageFilter !== "all" && lead.stageId !== selectedStageFilter) return false;

      // 3. Lead Source Filter
      if (sourceFilter !== "all" && (lead.source || "").toUpperCase() !== sourceFilter.toUpperCase()) return false;

      // 4. SLA Status Filter
      if (slaFilter === "overdue") {
        if (!lead.slaDeadline || new Date(lead.slaDeadline) >= now) return false;
      } else if (slaFilter === "within_sla") {
        if (!lead.slaDeadline || new Date(lead.slaDeadline) < now) return false;
      }

      // 5. Date Range Filter
      if (dateFilter !== "all") {
        const leadDate = new Date(lead.createdAt || Date.now());
        if (dateFilter === "today") {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          if (leadDate < startOfDay) return false;
        } else if (dateFilter === "7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (leadDate < sevenDaysAgo) return false;
        } else if (dateFilter === "30days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (leadDate < thirtyDaysAgo) return false;
        } else if (dateFilter === "custom") {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (leadDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (leadDate > end) return false;
          }
        }
      }

      // 6. Global Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (lead.fullName || "").toLowerCase().includes(q);
        const emailMatch = (lead.email || "").toLowerCase().includes(q);
        const phoneMatch = (lead.phone || "").toLowerCase().includes(q);
        const customIdMatch = (lead.leadCustomId || "").toLowerCase().includes(q);
        const companyMatch = (lead.companyName || "").toLowerCase().includes(q);
        const cityMatch = (lead.city || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || customIdMatch || companyMatch || cityMatch;
      }

      return true;
    });
  }, [leads, selectedBrand, selectedStageFilter, sourceFilter, slaFilter, dateFilter, customStartDate, customEndDate, searchQuery]);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Pro Excel Export Handler (.csv / .xlsx compatible with UTF-8 BOM)
  const handleExportExcel = (mode: "selected" | "filtered" | "all" = "filtered") => {
    let targetDataset: Partial<ILead>[] = [];

    if (mode === "selected") {
      targetDataset = leads.filter((l) => l._id && selectedLeadIds.includes(l._id.toString()));
      if (targetDataset.length === 0) {
        alert("No leads currently selected. Please check leads in the table first.");
        return;
      }
    } else if (mode === "all") {
      targetDataset = leads;
    } else {
      targetDataset = filteredLeads;
    }

    if (targetDataset.length === 0) {
      alert("No leads found matching current filter criteria to export.");
      return;
    }

    const headers = [
      "Lead ID",
      "Brand Entity",
      "Full Name",
      "Email Address",
      "Phone Number",
      "Company Name",
      "City",
      "Source",
      "Stage Status",
      "Score",
      "Estimated Budget (INR)",
      "SLA Deadline",
      "Occasion / Event Type",
      "Kids Quantity",
      "Budget Per Gift",
      "Age Group",
      "Event Date",
      "Special Requirements",
      "Created Date",
    ];

    const rows = targetDataset.map((l) => [
      `"${l.leadCustomId || ""}"`,
      `"${(l.business || "").toUpperCase()}"`,
      `"${(l.fullName || "").replace(/"/g, '""')}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${(l.companyName || "").replace(/"/g, '""')}"`,
      `"${(l.city || "").replace(/"/g, '""')}"`,
      `"${l.source || ""}"`,
      `"${l.stageId || ""}"`,
      l.score || 0,
      l.estimatedBudget || 0,
      `"${l.slaDeadline ? new Date(l.slaDeadline).toLocaleString() : ""}"`,
      `"${l.titepoData?.eventType || ""}"`,
      `"${l.titepoData?.kidsCount || ""}"`,
      `"${l.titepoData?.budgetPerGift || ""}"`,
      `"${l.titepoData?.childAgeGroup || ""}"`,
      `"${l.titepoData?.eventDate || ""}"`,
      `"${(l.titepoData?.specialRequirements || "").replace(/"/g, '""')}"`,
      `"${l.createdAt ? new Date(l.createdAt).toLocaleString() : ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `Tzar_CRM_Leads_Export_${mode}_${selectedBrand}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportMenuOpen(false);
  };

  // Bulk Selection Handlers
  const toggleSelectLead = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredLeads.map((l) => l._id?.toString()).filter(Boolean) as string[];
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedLeadIds.length} selected leads? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingBulk(true);
    try {
      const res = await fetch("/api/v1/leads/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      }).then((r) => r.json());

      if (res.deletedCount !== undefined) {
        setLeads((prev) => prev.filter((l) => !selectedLeadIds.includes(l._id?.toString() || "")));
        setSelectedLeadIds([]);
      } else {
        alert(`Error: ${res.error || "Failed to bulk delete leads"}`);
      }
    } catch (err: any) {
      console.error("Bulk Delete error:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsDeletingBulk(false);
    }
  };

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

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Refresh Data Button */}
          <button
            onClick={() => {
              setIsLiveSyncing(true);
              fetch(`/api/v1/leads?business=${selectedBrand}`)
                .then((r) => r.json())
                .then((d) => {
                  if (d.leads) setLeads(d.leads);
                })
                .finally(() => setTimeout(() => setIsLiveSyncing(false), 500));
            }}
            disabled={isLiveSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Reload lead data from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLiveSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh Grid</span>
          </button>

          {/* 2. Live Meta Graph API Auto-Sync Button */}
          <button
            onClick={async () => {
              setIsLiveSyncing(true);
              try {
                const res = await fetch("/api/v1/meta/sync-historical", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    business: selectedBrand === "all" ? "tzar" : selectedBrand,
                  }),
                }).then((r) => r.json());

                const updated = await fetch(`/api/v1/leads?business=${selectedBrand}`).then((r) => r.json());
                if (updated.leads) setLeads(updated.leads);
              } catch (err: any) {
                console.warn("Graph Sync Notice:", err);
              } finally {
                setTimeout(() => setIsLiveSyncing(false), 500);
              }
            }}
            disabled={isLiveSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Auto-discover & sync lead forms directly from Meta Graph API"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-600 ${isLiveSyncing ? "animate-spin" : ""}`} />
            <span>Sync Graph API</span>
          </button>

          {/* 3. Improved Import Meta Leads Button */}
          <button
            onClick={() => {
              setCsvResultMsg(null);
              setIsCsvModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Import Leads via Graph API or CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Import Meta Leads
          </button>

          {/* 4. Add New Lead Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add New Lead
          </button>
        </div>

        {/* Brand Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl border border-slate-300">
          {availableBrands.map((bSlug) => {
            const config = BRAND_CONFIG[bSlug as keyof typeof BRAND_CONFIG];
            if (!config) return null;
            const Icon = config.icon;
            const isSelected = selectedBrand === bSlug;

            return (
              <button
                key={bSlug}
                onClick={() => setSelectedBrand(bSlug as "all" | BusinessSlug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-sm border border-slate-300 ring-2 ring-emerald-600/30"
                    : "text-slate-700 hover:bg-slate-300/60"
                }`}
              >
                {config.logo ? (
                  <img src={config.logo} alt={config.label} className="h-3.5 w-auto object-contain max-h-4" />
                ) : (
                  <>
                    <Icon className="w-3.5 h-3.5 text-slate-700" />
                    <span>{config.label}</span>
                  </>
                )}
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
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by lead name, phone, email, company, custom ID, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-(--color-brand-green) focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                isFilterPanelOpen || dateFilter !== "all" || sourceFilter !== "all" || slaFilter !== "all"
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Advanced Filters</span>
              {(dateFilter !== "all" || sourceFilter !== "all" || slaFilter !== "all") && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>

            {/* Excel Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Export leads dataset to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" /> Export Excel
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-300 rounded-xl shadow-xl z-30 p-1 space-y-1 text-xs animate-fade-in">
                  <button
                    onClick={() => handleExportExcel("selected")}
                    disabled={selectedLeadIds.length === 0}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800"
                  >
                    <span>Selected Leads</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                      {selectedLeadIds.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleExportExcel("filtered")}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between hover:bg-slate-100 text-slate-800"
                  >
                    <span>Current Filtered View</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                      {filteredLeads.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleExportExcel("all")}
                    className="w-full text-left px-3 py-2 rounded-lg font-bold flex items-center justify-between hover:bg-slate-100 text-slate-800 border-t border-slate-100 pt-2"
                  >
                    <span>All Leads Dataset</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                      {leads.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {selectedStageFilter !== "all" && (
              <button
                onClick={() => setSelectedStageFilter("all")}
                className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
              >
                Clear Stage
              </button>
            )}

            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Showing {filteredLeads.length} leads
            </span>
          </div>
        </div>

        {/* Multi-Level Filter Panel (Collapsible) */}
        {isFilterPanelOpen && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold animate-fade-in">
            {/* Date Range Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="all">All Dates (Lifetime)</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Lead Source Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Lead Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="all">All Lead Sources</option>
                <option value="META_LEAD_AD">Meta Lead Ads</option>
                <option value="WEBSITE">Website Contact Form</option>
                <option value="WHATSAPP">WhatsApp Direct</option>
                <option value="DIRECT_INBOUND">Direct Phone Call</option>
                <option value="MANUAL">Manual Entry</option>
              </select>
            </div>

            {/* SLA Status Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                SLA Compliance
              </label>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-xl bg-white outline-none font-bold text-slate-900 cursor-pointer"
              >
                <option value="all">All SLA Statuses</option>
                <option value="within_sla">Within SLA (Active)</option>
                <option value="overdue">⚠️ SLA Overdue</option>
              </select>
            </div>

            {/* Reset Filters CTA */}
            <div className="flex items-end justify-between gap-2">
              {dateFilter === "custom" && (
                <div className="flex gap-2 flex-1">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-1/2 p-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-1/2 p-1.5 border border-slate-300 rounded-lg bg-white text-[11px]"
                  />
                </div>
              )}
              <button
                onClick={() => {
                  setDateFilter("all");
                  setSourceFilter("all");
                  setSlaFilter("all");
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all cursor-pointer whitespace-nowrap"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── BULK ACTIONS BAR (Appears when leads are selected) ────────── */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 px-5 rounded-2xl flex items-center justify-between shadow-lg border border-slate-800 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
              {selectedLeadIds.length} Selected
            </span>
            <p className="text-xs font-medium text-slate-300">
              Bulk actions for selected leads across entity pipelines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l._id?.toString() || ""))
                ? "Deselect All Visible"
                : "Select All Visible"}
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            >
              Clear Selection
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={isDeletingBulk}
              className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isDeletingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Selected ({selectedLeadIds.length})
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. HIGH-DENSITY SMART DATA GRID ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 w-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAll();
                    }}
                    className="text-slate-500 hover:text-slate-900 cursor-pointer flex items-center"
                    title="Select/Deselect All Visible Leads"
                  >
                    {filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l._id?.toString() || "")) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Lead ID</th>
                <th className="py-3.5 px-4">Brand Entity</th>
                <th className="py-3.5 px-4">Submitted Date</th>
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
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
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
                  const isSelected = selectedLeadIds.includes(lead._id?.toString() || "");

                  return (
                    <tr
                      key={lead._id?.toString() || lead.leadCustomId}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        isSelected ? "bg-emerald-50/50" : ""
                      }`}
                      onClick={() => router.push(`/pipeline/${lead._id}`)}
                    >
                      {/* Checkbox Cell */}
                      <td className="py-3.5 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectLead(lead._id?.toString() || "")}
                          className="text-slate-500 hover:text-slate-900 cursor-pointer flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      {/* Lead Custom ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {lead.leadCustomId}
                      </td>

                      {/* Brand Entity Badge with Image Logo */}
                      <td className="py-3.5 px-4">
                        {bConfig.logo ? (
                          <img src={bConfig.logo} alt={bConfig.label} className="h-4 w-auto object-contain max-h-4" />
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl ${bConfig.bg} ${bConfig.text}`}>
                            <BIcon className="w-3.5 h-3.5" />
                            <span>{bConfig.label}</span>
                          </span>
                        )}
                      </td>

                      {/* Facebook Lead Submitted Date */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}
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
                            <FacebookIcon className="w-3.5 h-3.5 fill-white text-white" /> META_LEAD_AD
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

      {/* ─── CSV LEAD IMPORT MODAL ────────────────────────────────────── */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-300 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Import Meta Lead Ads CSV
                </h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Business Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={csvBusiness}
                  onChange={(e) => setCsvBusiness(e.target.value as BusinessSlug)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50 cursor-pointer"
                >
                  <option value="tzar">Tzar Agency (Digital Marketing & WebDev)</option>
                  <option value="adshalaa">Adshalaa EdTech (Course Registrations)</option>
                  <option value="crownleaf">CrownLeaf Gifting (B2B Merchandise)</option>
                  <option value="titepo">Titepo Toys (Kids Educational Kits)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Select Downloaded Facebook CSV File
                </label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100/50 transition-colors cursor-pointer text-center">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                    {isUploadingCsv ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Importing CSV Leads...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-emerald-600" /> Choose Facebook Leads .csv File
                      </>
                    )}
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUploadGrid}
                    className="hidden"
                    disabled={isUploadingCsv}
                  />
                </label>
              </div>

              {csvResultMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold ${
                    csvResultMsg.startsWith("Error")
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {csvResultMsg}
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
