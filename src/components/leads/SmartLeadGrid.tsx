"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/invoices/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { MagnifyingGlass as Search, Funnel as Filter, Plus, Buildings as Building2, Phone, Envelope as Mail, Clock, Warning as AlertTriangle, PaperPlaneTilt as Send, DotsThreeVertical as MoreVertical, CheckCircle as CheckCircle2, CaretRight as ChevronRight, Briefcase, BookOpen, Gift, ShoppingBag, Stack as Layers, ArrowsDownUp as ArrowUpDown, ArrowsClockwise as RefreshCw, Lightning as Zap, DownloadSimple as Download, SpinnerGap as Loader2, X, Trash as Trash2, CheckSquare, Square, CalendarBlank as Calendar, ChatText as MessageSquare } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ILead, BusinessSlug, KanbanStage } from "@/models/Lead";
import { LeadWorkspaceDrawer } from "./LeadWorkspaceDrawer";
import { CreateLeadModal } from "./CreateLeadModal";
import { useDialogBehavior } from "@/hooks/use-dialog";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

/** One page of leads as the server returns it. */
export interface LeadPageData {
  leads: Partial<ILead>[];
  total: number;
  limit: number;
  totalPages: number;
  stageMetrics: Record<string, { count: number; value: number }>;
}

interface SmartLeadGridProps {
  initialPage: LeadPageData;
}

/** Start of a local day. Relative date filters use whole days so the request does not change every render. */
function startOfDay(daysAgo = 0): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

const BRAND_CONFIG: Record<
  "all" | BusinessSlug,
  { label: string; bg: string; text: string; border: string; icon: any; logo: string }
> = {
  all: { label: "All Businesses", bg: "bg-primary", text: "text-white", border: "border-primary", icon: Layers, logo: "" },
  tzar: { label: "Tzar Agency", bg: "bg-primary", text: "text-white", border: "border-primary", icon: Briefcase, logo: "/tzar-logo.png" },
  adshalaa: { label: "Adshalaa EdTech", bg: "bg-primary", text: "text-white", border: "border-primary", icon: BookOpen, logo: "/adshalaa-logo.png" },
  crownleaf: { label: "CrownLeaf Gifting", bg: "bg-primary", text: "text-white", border: "border-primary", icon: Gift, logo: "/Crownleaf-logo.png" },
  titepo: { label: "Titepo Toys", bg: "bg-primary", text: "text-white", border: "border-primary", icon: ShoppingBag, logo: "/titepo-logo.png" },
};

const STAGES: { id: KanbanStage; name: string; color: string }[] = [
  { id: "new-lead", name: "New Lead", color: "bg-card text-foreground border-input" },
  { id: "contacted", name: "Contacted", color: "bg-card text-foreground border-input" },
  { id: "discovery-call", name: "Discovery Call", color: "bg-card text-foreground border-input" },
  { id: "proposal-sent", name: "Proposal Sent", color: "bg-card text-foreground border-input" },
  { id: "negotiation", name: "Negotiation", color: "bg-card text-foreground border-input" },
  { id: "closed-won", name: "Closed Won", color: "bg-card text-foreground border-input" },
  { id: "closed-lost", name: "Closed Lost", color: "bg-card text-foreground border-input" },
];

/** META_LEAD_AD becomes "Meta lead ad", WEBSITE_BROCHURE becomes "Website brochure". */
function sourceLabel(source?: string): string {
  if (!source) return "Unknown";
  const text = source.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function makeRequestKey(filters: URLSearchParams, page: number, limit: number, reload: number): string {
  const p = new URLSearchParams(filters);
  p.set("page", String(page));
  p.set("limit", String(limit));
  p.set("r", String(reload));
  return p.toString();
}

export function SmartLeadGrid({ initialPage }: SmartLeadGridProps) {
  const router = useRouter();
  const { notify } = useToast();
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

  // The server filters, sorts and pages the leads. This holds the page currently on screen.
  const [data, setData] = useState<LeadPageData & { key: string }>({ ...initialPage, key: makeRequestKey(new URLSearchParams(), 1, initialPage.limit, 0) });
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const leads = data.leads;
  const setLeads = (update: (prev: Partial<ILead>[]) => Partial<ILead>[]) => setData((d) => ({ ...d, leads: update(d.leads) }));
  const reload = useCallback(() => setReloadToken((t) => t + 1), []);
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // CSV Import Modal State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const dialogRef = useDialogBehavior(isCsvModalOpen, () => setIsCsvModalOpen(false));
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
          reload();
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

  // ─── Real Meta Graph API Auto-Sync & Database Heartbeat ─────────────────
  const [metaSyncNotice, setMetaSyncNotice] = useState<string | null>(null);
  const [isMetaAutoSyncing, setIsMetaAutoSyncing] = useState(false);

  const fetchLatestLeadsFromDb = useCallback(async () => {
    reload();
  }, [reload]);

  const triggerMetaAutoSync = useCallback(
    async (force = false, includeArchived = false) => {
      try {
        setIsMetaAutoSyncing(true);
        const brandParam = selectedBrand !== "all" ? `&business=${selectedBrand}` : "";
        const res = await fetch(
          `/api/v1/meta/auto-sync?force=${force}&includeArchived=${includeArchived}${brandParam}`
        );
        if (res.ok) {
          const data = await res.json();
          const synced = data.summary?.totalSynced || 0;
          const skipped = data.summary?.totalSkipped || 0;

          if (synced > 0) {
            setMetaSyncNotice(`${synced} new Meta Lead Ads automatically ingested!`);
            setTimeout(() => setMetaSyncNotice(null), 6000);
            await fetchLatestLeadsFromDb();
          } else if (force) {
            setMetaSyncNotice(`All Meta Leads Up-To-Date (${skipped} duplicates verified on Facebook)`);
            setTimeout(() => setMetaSyncNotice(null), 4000);
            await fetchLatestLeadsFromDb();
          }
        }
      } catch (err) {
        console.error("Meta Auto-Sync Error:", err);
      } finally {
        setIsMetaAutoSyncing(false);
      }
    },
    [selectedBrand, fetchLatestLeadsFromDb]
  );

  // The first page comes with the page itself. The 25-second background poll (Meta Graph API re-scan +
  // reload) is paused while the CRM is being fixed because it slows the whole site down.
  // The manual Refresh / Sync buttons still work. Set to true to turn the poll back on.
  useEffect(() => {
    const AUTO_FETCH_LEADS_ENABLED = false;
    if (!AUTO_FETCH_LEADS_ENABLED) return;

    // Fire background reconciliation check with Meta on tab switch
    triggerMetaAutoSync(false, false);

    const interval = setInterval(() => {
      triggerMetaAutoSync(false, false);
      fetchLatestLeadsFromDb();
    }, 25000);

    return () => clearInterval(interval);
  }, [selectedBrand, fetchLatestLeadsFromDb, triggerMetaAutoSync]);

  // ─── Search is sent to the server a moment after typing stops ───
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Filters become query parameters; the server does the filtering ───
  const [pageSize, setPageSize] = useState(initialPage.limit);

  const buildFilterParams = useCallback((): URLSearchParams => {
    const p = new URLSearchParams();
    if (selectedBrand !== "all") p.set("business", selectedBrand);
    if (selectedStageFilter !== "all") p.set("stage", selectedStageFilter);
    if (sourceFilter !== "all") p.set("source", sourceFilter);
    if (slaFilter !== "all") p.set("sla", slaFilter);
    if (dateFilter === "today") p.set("from", startOfDay(0).toISOString());
    else if (dateFilter === "7days") p.set("from", startOfDay(7).toISOString());
    else if (dateFilter === "30days") p.set("from", startOfDay(30).toISOString());
    else if (dateFilter === "custom") {
      if (customStartDate) p.set("from", new Date(`${customStartDate}T00:00:00`).toISOString());
      if (customEndDate) p.set("to", new Date(`${customEndDate}T23:59:59.999`).toISOString());
    }
    if (debouncedSearch) p.set("search", debouncedSearch);
    return p;
  }, [selectedBrand, selectedStageFilter, sourceFilter, slaFilter, dateFilter, customStartDate, customEndDate, debouncedSearch]);

  const filterKey = buildFilterParams().toString() + `|${pageSize}`;
  // The page number is remembered together with the filters it was chosen under, so changing any filter returns to page 1
  const [pageState, setPageState] = useState({ key: "", page: 1 });
  const total = data.total;
  const totalPages = Math.max(1, data.totalPages);
  const currentPage = Math.min(pageState.key === filterKey ? pageState.page : 1, totalPages);
  const goToPage = (p: number) => setPageState({ key: filterKey, page: Math.min(Math.max(1, p), totalPages) });

  const requestKey = makeRequestKey(buildFilterParams(), currentPage, pageSize, reloadToken);
  const isLoading = data.key !== requestKey && failedKey !== requestKey;
  const isLiveSyncing = isLoading;

  useEffect(() => {
    if (data.key === requestKey) return;
    const controller = new AbortController();
    fetch(`/api/v1/leads?${requestKey}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((d) => {
        setFailedKey(null);
        setData({ leads: d.leads, total: d.total, limit: d.limit, totalPages: d.totalPages, stageMetrics: d.stageMetrics, key: requestKey });
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setFailedKey(requestKey);
      });
    return () => controller.abort();
  }, [requestKey, data.key]);

  const pagedLeads = leads;
  const loadFailed = failedKey === requestKey;

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Pro Excel Export Handler (.csv / .xlsx compatible with UTF-8 BOM)
  const fetchLeadsForExport = async (mode: "selected" | "filtered" | "all"): Promise<Partial<ILead>[]> => {
    const out: Partial<ILead>[] = [];
    const MAX_ROWS = 10000;
    const pull = async (params: URLSearchParams) => {
      let page = 1;
      for (;;) {
        params.set("page", String(page));
        params.set("limit", "200");
        const res = await fetch(`/api/v1/leads?${params.toString()}`);
        if (!res.ok) throw new Error("Could not load leads for export");
        const d = await res.json();
        out.push(...d.leads);
        if (page >= d.totalPages || out.length >= MAX_ROWS) break;
        page += 1;
      }
    };
    if (mode === "selected") {
      for (let i = 0; i < selectedLeadIds.length; i += 100) {
        await pull(new URLSearchParams({ ids: selectedLeadIds.slice(i, i + 100).join(",") }));
      }
    } else if (mode === "all") {
      await pull(new URLSearchParams());
    } else {
      await pull(buildFilterParams());
    }
    return out;
  };

  // Pro Excel Export Handler (.csv / .xlsx compatible with UTF-8 BOM)
  const handleExportExcel = async (mode: "selected" | "filtered" | "all" = "filtered") => {
    setIsExportMenuOpen(false);
    if (mode === "selected" && selectedLeadIds.length === 0) {
      notify("info", "No leads are selected. Tick the boxes next to the leads you want first.");
      return;
    }

    let targetDataset: Partial<ILead>[] = [];
    try {
      targetDataset = await fetchLeadsForExport(mode);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Could not export leads.");
      return;
    }

    if (targetDataset.length === 0) {
      notify("info", "No leads match the current filters.");
      return;
    }

    const headers = [
      "Lead ID",
      "Brand",
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
    const visibleIds = pagedLeads.map((l) => l._id?.toString()).filter(Boolean) as string[];
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedLeadIds.includes(id));

    if (allSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.length === 0) return;
    setIsDeletingBulk(true);
    try {
      const res = await fetch("/api/v1/leads/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      }).then((r) => r.json());

      if (res.deletedCount !== undefined) {
        setSelectedLeadIds([]);
        reload();
      } else {
        notify("error", res.error || "Could not delete the selected leads.");
      }
    } catch (err: any) {
      console.error("Bulk Delete error:", err);
      notify("error", err.message || "Could not delete the selected leads.");
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Stage counts come from the server so they cover every lead, not just this page
  const stageMetrics = data.stageMetrics;

  const openLead = (lead: Partial<ILead>) => {
    setSelectedLeadForDrawer(lead);
    if (!lead._id) return;
    fetch(`/api/v1/leads/${lead._id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.lead) setSelectedLeadForDrawer((cur) => (cur && String(cur._id) === String(lead._id) ? { ...cur, ...d.lead } : cur));
      })
      .catch(() => undefined);
  };

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
      reload(); // refresh the stage counts, and drop the row if it no longer matches the stage filter
    } catch (err) {
      console.error("Failed to update lead stage:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── 1. BRAND SWITCHER BAR (BAGUI SHADCN STYLE) ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              Sales Pipeline
            </h1>
          </div>
          <p className="text-sm sm:text-sm font-semibold text-muted-foreground mt-0.5">
            Leads and deals across all four brands
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. Refresh Data Button */}
          <button
            onClick={reload}
            disabled={isLiveSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground bg-card hover:bg-muted border border-border hover:border-input rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Reload lead data from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${isLiveSyncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* 2. Real Live Meta Graph API Auto-Sync Button */}
          <button
            onClick={() => triggerMetaAutoSync(true, true)}
            disabled={isMetaAutoSyncing || isLiveSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground bg-card hover:bg-muted border border-border hover:border-input rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Perform active reconciliation scan across Meta Graph API lead forms"
          >
            <Zap className={`w-3.5 h-3.5 text-muted-foreground ${isMetaAutoSyncing ? "animate-spin" : ""}`} />
            <span>{isMetaAutoSyncing ? "Scanning Meta..." : "Sync Meta Leads"}</span>
          </button>

          {/* 3. Improved Import Meta Leads Button */}
          <button
            onClick={() => {
              setCsvResultMsg(null);
              setIsCsvModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground bg-card hover:bg-muted border border-border hover:border-input rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Import Leads via Graph API or CSV"
          >
            <Download className="w-3.5 h-3.5 text-success" /> Import Leads
          </button>

          {/* 4. Add New Lead Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>

        {/* Real-time Meta Sync Notification Banner */}
        {metaSyncNotice && (
          <div className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-success-soft border border-success text-sm font-semibold text-success animate-fade-in">
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-success animate-pulse" />
              {metaSyncNotice}
            </span>
            <button
              onClick={() => setMetaSyncNotice(null)}
              className="text-sm text-success hover:text-success cursor-pointer font-semibold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Brand Switcher Bar (100% Responsive Grid - All 5 Brands Fit Within Mobile Screen) */}
        <div className="w-full">
          <div className="grid grid-cols-5 gap-1 p-1 bg-muted rounded-2xl border border-border w-full">
            {availableBrands.map((bSlug) => {
              const config = BRAND_CONFIG[bSlug as keyof typeof BRAND_CONFIG];
              if (!config) return null;
              const isSelected = selectedBrand === bSlug;

              return (
                <button
                  key={bSlug}
                  onClick={() => setSelectedBrand(bSlug as "all" | BusinessSlug)}
                  className={`flex items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[34px] sm:min-h-[38px] ${
                    isSelected
                      ? "bg-card text-foreground shadow-2xs border border-border font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-border"
                  }`}
                  title={config.label}
                >
                  {config.logo ? (
                    <img
                      src={config.logo}
                      alt={config.label}
                      className="h-3.5 sm:h-5 w-auto object-contain max-w-[55px] sm:max-w-[85px]"
                    />
                  ) : (
                    <span className="text-xs sm:text-sm font-semibold">All</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 2A. MOBILE STAGE MATRIX (Fits 100% inside screen, zero cards moving outside) ─── */}
      <div className="md:hidden bg-card p-3 rounded-2xl border border-border shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            Pipeline Stages ({leads.length} Leads)
          </span>
          {selectedStageFilter !== "all" && (
            <button
              onClick={() => setSelectedStageFilter("all")}
              className="text-xs font-semibold text-destructive hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

        {/* 3-Column Touch Matrix of Stages - 100% Within Mobile Viewport */}
        <div className="grid grid-cols-3 gap-1.5">
          {STAGES.map((s) => {
            const metrics = stageMetrics[s.id] || { count: 0, value: 0 };
            const isActive = selectedStageFilter === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setSelectedStageFilter(isActive ? "all" : s.id)}
                className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-white border-ring shadow-xs"
                    : "bg-muted hover:bg-muted text-foreground border-border"
                }`}
              >
                <p className="text-xs font-semibold truncate leading-tight">{s.name}</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className={`text-sm font-semibold ${isActive ? "text-success" : "text-foreground"}`}>
                    {metrics.count}
                  </span>
                  {metrics.value > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground truncate">
                      ₹{metrics.value >= 1000 ? `${Math.round(metrics.value / 1000)}k` : metrics.value}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2B. DESKTOP 7-COLUMN STAGE CARDS (Visible on md+ screens) ─────────── */}
      <div className="hidden md:grid md:grid-cols-7 gap-3">
        {STAGES.map((s) => {
          const metrics = stageMetrics[s.id] || { count: 0, value: 0 };
          const isActive = selectedStageFilter === s.id;

          return (
            <button
              key={s.id}
              onClick={() => setSelectedStageFilter(isActive ? "all" : s.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-white border-ring shadow-sm"
                  : "bg-card text-foreground border-border hover:border-input shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-muted-foreground"}`}>
                  {s.name}
                </span>
                <span className={`text-sm font-bold ${isActive ? "text-white" : "text-foreground"}`}>
                  {metrics.count}
                </span>
              </div>
              <p className={`text-sm font-semibold tracking-tight ${isActive ? "text-success" : "text-foreground"}`}>
                ₹{metrics.value.toLocaleString("en-IN")}
              </p>
            </button>
          );
        })}
      </div>

      {/* ─── 3. SEARCH & CONTROLS TOOLBAR ───────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-input shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by lead name, phone, email, company, custom ID, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm font-semibold text-foreground bg-muted border border-border rounded-xl outline-hidden focus:border-(--color-brand-green) focus:bg-card transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer border ${
                isFilterPanelOpen || dateFilter !== "all" || sourceFilter !== "all" || slaFilter !== "all"
                  ? "bg-primary text-white border-ring shadow-xs"
                  : "bg-muted text-foreground border-input hover:bg-border"
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-success" />
              <span>Advanced Filters</span>
              {(dateFilter !== "all" || sourceFilter !== "all" || slaFilter !== "all") && (
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              )}
            </button>

            {/* Excel Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-foreground bg-card hover:bg-muted border border-border hover:border-input rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Export leads dataset to Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" /> Export Excel
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-input rounded-xl shadow-xl z-30 p-1 space-y-1 text-sm animate-fade-in">
                  <button
                    onClick={() => handleExportExcel("selected")}
                    disabled={selectedLeadIds.length === 0}
                    className="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                  >
                    <span>Selected Leads</span>
                    <span className="px-2 py-0.5 rounded bg-success-soft text-success text-xs">
                      {selectedLeadIds.length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleExportExcel("filtered")}
                    className="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between hover:bg-muted text-foreground"
                  >
                    <span>Current Filtered View</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-foreground text-xs">
                      {total.toLocaleString("en-IN")}
                    </span>
                  </button>
                  <button
                    onClick={() => handleExportExcel("all")}
                    className="w-full text-left px-3 py-2 rounded-lg font-semibold flex items-center justify-between hover:bg-muted text-foreground border-t border-border pt-2"
                  >
                    <span>All leads</span>
                    <span className="px-2 py-0.5 rounded bg-info-soft text-info text-xs">
                      {leads.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {selectedStageFilter !== "all" && (
              <button
                onClick={() => setSelectedStageFilter("all")}
                className="px-3 py-1.5 text-sm font-semibold text-destructive bg-destructive-soft border border-border rounded-xl hover:bg-destructive-soft transition-all cursor-pointer"
              >
                Clear Stage
              </button>
            )}

            <span className="text-sm font-medium text-muted-foreground">
              {total.toLocaleString("en-IN")} leads
            </span>
          </div>
        </div>

        {/* Multi-Level Filter Panel (Collapsible) */}
        {isFilterPanelOpen && (
          <div className="p-4 bg-muted border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm font-semibold animate-fade-in">
            {/* Date Range Filter */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full p-2 border border-input rounded-xl bg-card outline-none font-semibold text-foreground cursor-pointer"
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Lead Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full p-2 border border-input rounded-xl bg-card outline-none font-semibold text-foreground cursor-pointer"
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                SLA Compliance
              </label>
              <select
                value={slaFilter}
                onChange={(e) => setSlaFilter(e.target.value)}
                className="w-full p-2 border border-input rounded-xl bg-card outline-none font-semibold text-foreground cursor-pointer"
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
                    className="w-1/2 p-1.5 border border-input rounded-lg bg-card text-xs"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-1/2 p-1.5 border border-input rounded-lg bg-card text-xs"
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
                className="px-3 py-2 text-sm font-semibold text-destructive bg-destructive-soft border border-border rounded-xl hover:bg-destructive-soft transition-all cursor-pointer whitespace-nowrap"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── BULK ACTIONS BAR (appears when leads are selected) ─── */}
      {selectedLeadIds.length > 0 && (
        <div
          role="region"
          aria-label="Actions for selected leads"
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs animate-fade-in"
        >
          <p className="text-sm text-foreground">
            <span className="font-semibold">{selectedLeadIds.length}</span> lead{selectedLeadIds.length === 1 ? "" : "s"} selected
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              {pagedLeads.length > 0 && pagedLeads.every((l) => selectedLeadIds.includes(l._id?.toString() || ""))
                ? "Deselect this page"
                : "Select this page"}
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg border border-input bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
            >
              Clear selection
            </button>

            <button
              onClick={() => handleExportExcel("selected")}
              className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover cursor-pointer"
              title="Download the selected leads as an Excel file"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>

            {(userRole === "SUPER_ADMIN" || userRole === "ADMIN") && (
              <button
                onClick={() => setBulkDeleteOpen(true)}
                disabled={isDeletingBulk}
                className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg bg-destructive px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                title="Permanently delete the selected leads"
              >
                {isDeletingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <ConfirmDialog
          title={`Delete ${selectedLeadIds.length} lead${selectedLeadIds.length === 1 ? "" : "s"}?`}
          message="The selected leads and their notes are removed for good. This cannot be undone."
          confirmLabel="Delete leads"
          cancelLabel="Keep leads"
          onConfirm={() => {
            setBulkDeleteOpen(false);
            handleBulkDelete();
          }}
          onClose={() => setBulkDeleteOpen(false)}
        />
      )}

      {/* ─── 4A. MOBILE TOUCH-OPTIMIZED LEAD CARDS (Visible on < md screens) ─── */}
      <div className="md:hidden space-y-3">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-muted-foreground bg-card rounded-2xl border border-border">
            No leads found matching current search or filters.
          </div>
        ) : (
          pagedLeads.map((lead) => {
            const bSlug = (lead.business || "tzar") as BusinessSlug;
            const bConfig = BRAND_CONFIG[bSlug] || BRAND_CONFIG.tzar;
            const currentStageObj = STAGES.find((s) => s.id === lead.stageId) || STAGES[0];
            const isSelected = selectedLeadIds.includes(lead._id?.toString() || "");

            return (
              <div
                key={lead._id?.toString() || lead.leadCustomId}
                className={`p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-3 transition-all ${
                  isSelected ? "ring-2 ring-ring" : ""
                }`}
              >
                {/* Header Row: Checkbox, ID, Brand Logo, Stage Selector */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectLead(lead._id?.toString() || "");
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-success" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>

                    <span className="font-mono font-semibold text-sm text-foreground whitespace-nowrap">
                      {lead.leadCustomId}
                    </span>

                    {bConfig.logo ? (
                      <img src={bConfig.logo} alt={bConfig.label} className="h-4 w-auto object-contain max-h-4" />
                    ) : (
                      <span className="text-sm font-semibold text-foreground">{bConfig.label}</span>
                    )}
                  </div>

                  {/* Stage Selector Dropdown */}
                  <select
                    value={lead.stageId || "new-lead"}
                    onChange={(e) =>
                      handleStageChange(lead._id!.toString(), e.target.value as KanbanStage)
                    }
                    className="h-9 rounded-lg border border-input bg-card px-2 text-sm font-medium text-foreground outline-none cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Middle Row: Name, Phone, Service, Submitted Date */}
                <div
                  onClick={() => router.push(`/pipeline/${lead._id}`)}
                  className="cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground">{lead.fullName}</p>
                    <span className="text-xs font-medium text-muted-foreground">{sourceLabel(lead.source)}</span>
                  </div>

                  <p className="text-sm font-semibold text-muted-foreground truncate">
                    {lead.interestedServices?.[0] || lead.companyName || "General Inquiry"}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <span>{lead.phone}</span>
                    <span>•</span>
                    <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""}</span>
                  </div>
                </div>

                {/* Bottom Row: Est Budget & Quick Touch Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground ">Est. Value</span>
                    <p className="text-sm font-semibold text-foreground">
                      {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString("en-IN")}` : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* WhatsApp Quick Link */}
                    <a
                      href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                      title="Chat on WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>

                    {/* Phone Call Link */}
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                      title="Call Lead"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    {/* 360 Workspace Drawer Link */}
                    <button
                      onClick={() => openLead(lead)}
                      className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Open lead details"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {loadFailed && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">
          Could not load leads.
          <button onClick={reload} className="underline cursor-pointer">
            Try again
          </button>
        </div>
      )}

      {/* ─── 4B. DESKTOP DATA GRID (md and up). Fits the screen; scrolls sideways only on narrow windows. ─── */}
      <div className={`hidden md:block bg-card rounded-xl border border-border shadow-xs overflow-hidden transition-opacity ${isLoading ? "opacity-60" : ""}`} aria-busy={isLoading}>
        <div className="max-h-[calc(100vh-15rem)] min-h-[320px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[860px] text-left text-sm border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-muted-foreground font-semibold text-sm">
                <th className="sticky top-0 z-10 bg-muted py-3 pl-4 pr-2 w-10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectAll();
                    }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                    title="Select or clear every lead on this page"
                    aria-label="Select or clear every lead on this page"
                  >
                    {pagedLeads.length > 0 && pagedLeads.every((l) => selectedLeadIds.includes(l._id?.toString() || "")) ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 whitespace-nowrap">Lead</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 whitespace-nowrap">Brand</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3">Contact</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3">Interest</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 hidden 2xl:table-cell whitespace-nowrap">Source</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 whitespace-nowrap">SLA</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 whitespace-nowrap">Stage</th>
                <th className="sticky top-0 z-10 bg-muted py-3 px-3 hidden 2xl:table-cell whitespace-nowrap">Budget</th>
                <th className="sticky top-0 z-10 bg-muted py-3 pl-3 pr-4 text-right whitespace-nowrap">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground font-medium">
                    No leads match the current search or filters.
                  </td>
                </tr>
              ) : (
                pagedLeads.map((lead) => {
                  const bSlug = (lead.business || "tzar") as BusinessSlug;
                  const bConfig = BRAND_CONFIG[bSlug] || BRAND_CONFIG.tzar;
                  const isOverdue = lead.slaDeadline ? new Date(lead.slaDeadline) < new Date() : false;
                  const currentStageObj = STAGES.find((s) => s.id === lead.stageId) || STAGES[0];
                  const isSelected = selectedLeadIds.includes(lead._id?.toString() || "");
                  const submitted = lead.createdAt ? new Date(lead.createdAt) : null;

                  let interest = lead.interestedServices?.[0];
                  if (!interest || interest === "General Inquiry" || interest === "Meta Lead Ad Form") {
                    if (lead.business === "titepo") {
                      interest = lead.titepoData?.eventType
                        ? `${lead.titepoData.eventType} (${lead.titepoData.kidsCount || "Return Gifts"})`
                        : "Return gifts and favours";
                    } else if (lead.business === "tzar") {
                      interest = lead.tzarData?.serviceNeeded || (lead.companyName ? `${lead.companyName} - Web development` : "Web development and marketing");
                    } else if (lead.business === "adshalaa") {
                      interest = lead.adshalaaData?.courseName || lead.adshalaaData?.programName || "Digital marketing course";
                    } else if (lead.business === "crownleaf") {
                      interest = lead.crownleafData?.giftingOccasion || "Corporate gifting hampers";
                    } else {
                      interest = "Sales enquiry";
                    }
                  }

                  return (
                    <tr
                      key={lead._id?.toString() || lead.leadCustomId}
                      className={`transition-colors cursor-pointer group ${isSelected ? "bg-muted" : "hover:bg-muted"}`}
                      onClick={() => router.push(`/pipeline/${lead._id}`)}
                    >
                      <td className="py-3 pl-4 pr-2 w-10" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectLead(lead._id?.toString() || "")}
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center"
                          aria-label={isSelected ? "Deselect lead" : "Select lead"}
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Lead ID and when it came in */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <p className="font-mono font-semibold text-foreground">{lead.leadCustomId}</p>
                        <p className="text-sm text-muted-foreground">
                          {submitted
                            ? `${submitted.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${submitted.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                            : "N/A"}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        {bConfig.logo ? (
                          <img src={bConfig.logo} alt={bConfig.label} className="h-5 w-auto max-w-[88px] object-contain" />
                        ) : (
                          <span className="font-medium text-foreground whitespace-nowrap">{bConfig.label}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="font-semibold text-foreground truncate" title={lead.fullName}>
                          {lead.fullName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate" title={`${lead.phone || ""} ${lead.email || ""}`}>
                          {[lead.phone, lead.email].filter(Boolean).join("  ·  ")}
                        </p>
                      </td>

                      <td className="py-3 px-3 max-w-[190px]">
                        <p className="font-medium text-foreground truncate" title={interest}>
                          {interest}
                        </p>
                        <p className="text-sm text-muted-foreground truncate 2xl:hidden">
                          {[sourceLabel(lead.source), lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString("en-IN")}` : ""].filter(Boolean).join("  ·  ")}
                        </p>
                      </td>

                      <td className="py-3 px-3 hidden 2xl:table-cell whitespace-nowrap text-foreground">{sourceLabel(lead.source)}</td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
                            <AlertTriangle className="w-4 h-4" /> Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                            <Clock className="w-4 h-4" /> Within SLA
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.stageId || "new-lead"}
                          onChange={(e) => handleStageChange(lead._id!.toString(), e.target.value as KanbanStage)}
                          aria-label={`Stage for ${lead.fullName}`}
                          className="h-9 w-full min-w-[130px] rounded-lg border border-input bg-card px-2.5 text-sm font-medium text-foreground outline-none cursor-pointer hover:border-ring focus-visible:border-ring"
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-3 hidden 2xl:table-cell whitespace-nowrap font-medium text-foreground">
                        {lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString("en-IN")}` : "—"}
                      </td>

                      <td className="py-3 pl-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
                            title="Chat on WhatsApp"
                            aria-label="Chat on WhatsApp"
                          >
                            <Send className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => openLead(lead)}
                            className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Open lead details"
                            aria-label="Open lead details"
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

      {total > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={goToPage}
          onPageSizeChange={setPageSize}
          label="leads"
        />
      )}

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
          setSelectedLeadForDrawer(null);
          reload();
        }}
      />

      {/* Manual Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={(newLead) => {
          reload();
        }}
      />

      {/* ─── CSV LEAD IMPORT MODAL ────────────────────────────────────── */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Import leads" tabIndex={-1} className="bg-card rounded-3xl p-6 max-w-md w-full border border-input shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-success" />
                <h3 className="text-base font-semibold text-foreground">
                  Import Meta Lead Ads CSV
                </h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-muted-foreground rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Target Business Entity <span className="text-destructive">*</span>
                </label>
                <select
                  value={csvBusiness}
                  onChange={(e) => setCsvBusiness(e.target.value as BusinessSlug)}
                  className="w-full px-3.5 py-2.5 border border-input rounded-xl font-semibold text-foreground outline-none bg-muted cursor-pointer"
                >
                  <option value="tzar">Tzar Agency (Digital Marketing & WebDev)</option>
                  <option value="adshalaa">Adshalaa EdTech (Course Registrations)</option>
                  <option value="crownleaf">CrownLeaf Gifting (B2B Merchandise)</option>
                  <option value="titepo">Titepo Toys (Kids Educational Kits)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-foreground">
                  Select Downloaded Facebook CSV File
                </label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-success rounded-2xl bg-success-soft hover:bg-success-soft transition-colors cursor-pointer text-center">
                  <span className="text-sm font-semibold text-success flex items-center gap-2">
                    {isUploadingCsv ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-success" /> Importing CSV Leads...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-success" /> Choose Facebook Leads .csv File
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
                  className={`p-3.5 rounded-xl border text-sm font-semibold ${
                    csvResultMsg.startsWith("Error")
                      ? "bg-destructive-soft border-border text-destructive"
                      : "bg-success-soft border-border text-success"
                  }`}
                >
                  {csvResultMsg}
                </div>
              )}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-foreground bg-muted hover:bg-border rounded-xl cursor-pointer"
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
