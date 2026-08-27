"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  DollarSign,
  Users,
  TrendingUp,
  Award,
  RefreshCw,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
  PauseCircle,
  Download,
  Plus,
  X,
  Loader2,
  Briefcase,
  BookOpen,
  Gift,
  ShoppingBag,
} from "lucide-react";

interface CampaignItem {
  _id: string;
  campaignId: string;
  campaignName: string;
  adAccountId: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
  leadsCaptured: number;
  wonDeals: number;
  revenueGenerated: number;
  roas: number;
  datePreset: string;
  lastSyncedAt: string;
}

interface KpiSummary {
  totalAdSpend: number;
  totalLeadsCaptured: number;
  avgCpl: number;
  totalRevenue: number;
  overallRoas: number;
}

export default function MetaAdsDashboard() {
  const [kpis, setKpis] = useState<KpiSummary>({
    totalAdSpend: 0,
    totalLeadsCaptured: 0,
    avgCpl: 0,
    totalRevenue: 0,
    overallRoas: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [datePreset, setDatePreset] = useState("this_month");
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Historical Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [syncFormId, setSyncFormId] = useState("");
  const [syncBusiness, setSyncBusiness] = useState<"tzar" | "adshalaa" | "crownleaf" | "titepo">("tzar");
  const [syncToken, setSyncToken] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [syncResultMsg, setSyncResultMsg] = useState<string | null>(null);

  // Campaign Ad Spend Modal State
  const [isAdSpendModalOpen, setIsAdSpendModalOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [campSpend, setCampSpend] = useState<number | "">(0);
  const [campLeads, setCampLeads] = useState<number | "">(0);
  const [campRevenue, setCampRevenue] = useState<number | "">(0);
  const [campStatus, setCampStatus] = useState<"ACTIVE" | "PAUSED">("ACTIVE");
  const [isSavingCamp, setIsSavingCamp] = useState(false);

  const fetchMetaInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/v1/meta-ads");
      setKpis(res.data.kpiSummary);
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch Meta Ads insights:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetaInsights();
  }, [fetchMetaInsights]);

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await axios.post("/api/v1/meta-ads");
      fetchMetaInsights();
    } catch (err) {
      console.error("Failed to sync Meta Graph API:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit Historical Leads Import
  const handleHistoricalImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncFormId.trim()) return;
    setIsImporting(true);
    setSyncResultMsg(null);

    try {
      const res = await axios.post("/api/v1/meta/sync-historical", {
        formId: syncFormId.trim(),
        business: syncBusiness,
        pageAccessToken: syncToken.trim() || undefined,
      });

      setSyncResultMsg(res.data.message || "Historical leads successfully imported!");
      fetchMetaInsights();
    } catch (err: any) {
      console.error("Historical import error:", err);
      setSyncResultMsg(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Submit Ad Spend Data
  const handleSaveAdSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim()) return;
    setIsSavingCamp(true);

    try {
      await axios.post("/api/v1/meta-ads", {
        campaignName: campName.trim(),
        spend: Number(campSpend) || 0,
        leadsCaptured: Number(campLeads) || 0,
        revenueGenerated: Number(campRevenue) || 0,
        status: campStatus,
      });

      setIsAdSpendModalOpen(false);
      setCampName("");
      setCampSpend(0);
      setCampLeads(0);
      setCampRevenue(0);
      fetchMetaInsights();
    } catch (err) {
      console.error("Failed to save campaign financial data:", err);
    } finally {
      setIsSavingCamp(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white font-bold"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Meta Lead Ads & Financial ROI Engine
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Real-Time Ad Spend, Cost Per Lead (CPL), ROAS & Historical Lead Import
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Historical Sync CTA */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Import Past Leads
          </button>

          {/* Add Campaign Ad Spend CTA */}
          <button
            onClick={() => setIsAdSpendModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Add Campaign Budget
          </button>

          {/* Sync Graph API */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-(--color-brand-green) hover:bg-(--color-brand-green-hover) rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Resyncing..." : "Sync Graph API"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Ad Spend */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Meta Ad Spend
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ₹{kpis.totalAdSpend.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Across connected Meta ad campaigns</p>
        </div>

        {/* Card 2: Total Leads Captured */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Meta Leads Ingested
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-(--color-brand-green)">
            {kpis.totalLeadsCaptured}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Ingested into CRM pipelines</p>
        </div>

        {/* Card 3: Avg Cost Per Lead */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Average CPL (Cost/Lead)
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ₹{kpis.avgCpl.toFixed(2)}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Average Cost Per Ingested Lead</p>
        </div>

        {/* Card 4: Est Revenue / ROAS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Overall ROAS
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-600">
            {kpis.overallRoas.toFixed(1)}x
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            ₹{kpis.totalRevenue.toLocaleString()} closed revenue
          </p>
        </div>
      </div>

      {/* Campaign Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-(--color-brand-green)" />
            <h3 className="text-sm font-bold text-slate-900">
              Campaign Ad Spend & ROI Attribution Matrix
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {campaigns.length} Active Campaigns Managed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Campaign Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Ad Spend (₹)</th>
                <th className="py-3.5 px-4">Impressions</th>
                <th className="py-3.5 px-4">Clicks (CTR)</th>
                <th className="py-3.5 px-4">Leads</th>
                <th className="py-3.5 px-4">CPL</th>
                <th className="py-3.5 px-4">Won Revenue</th>
                <th className="py-3.5 px-4 text-right">ROAS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    Loading Meta campaign metrics...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No active Meta Lead Ads campaigns connected yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900 text-xs">
                        {c.campaignName}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {c.campaignId}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      {c.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <PauseCircle className="w-3 h-3" /> PAUSED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ₹{c.spend.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {c.impressions.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {c.clicks.toLocaleString()} ({c.ctr}%)
                    </td>
                    <td className="py-4 px-4 font-bold text-(--color-brand-green)">
                      {c.leadsCaptured}
                    </td>
                    <td className="py-4 px-4 text-slate-900">
                      ₹{c.cpl.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-700">
                      ₹{c.revenueGenerated.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-purple-700">
                      {c.roas.toFixed(1)}x
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: HISTORICAL LEADS IMPORT ───────────────────────────── */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-300 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Import Historical Meta Leads
                </h3>
              </div>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleHistoricalImport} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Meta Lead Form ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2008261928374 or form ID from Meta"
                  value={syncFormId}
                  onChange={(e) => setSyncFormId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none focus:border-emerald-600 bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Target Business Entity <span className="text-rose-500">*</span>
                </label>
                <select
                  value={syncBusiness}
                  onChange={(e) => setSyncBusiness(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                >
                  <option value="tzar">Tzar Agency (Digital Marketing & WebDev)</option>
                  <option value="adshalaa">Adshalaa EdTech (Course Registrations)</option>
                  <option value="crownleaf">CrownLeaf Gifting (B2B Merchandise)</option>
                  <option value="titepo">Titepo Toys (Kids Educational Kits)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Page Access Token (Optional - defaults to env setting)
                </label>
                <input
                  type="password"
                  placeholder="Leave empty to use process.env.META_PAGE_ACCESS_TOKEN"
                  value={syncToken}
                  onChange={(e) => setSyncToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 outline-none bg-slate-50"
                />
              </div>

              {syncResultMsg && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-bold ${
                    syncResultMsg.startsWith("Error")
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {syncResultMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={isImporting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 text-emerald-400" />
                  )}
                  {isImporting ? "Importing..." : "Sync Form Leads"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD/EDIT CAMPAIGN AD SPEND FINANCIAL DATA ─────────── */}
      {isAdSpendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-300 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Manage Campaign Ad Spend Budget
                </h3>
              </div>
              <button
                onClick={() => setIsAdSpendModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdSpend} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Campaign Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tzar WebDev Meta Ads Q3"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ad Spend (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={campSpend}
                    onChange={(e) => setCampSpend(e.target.value === "" ? "" : Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Leads Captured
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={campLeads}
                    onChange={(e) => setCampLeads(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Won Deals Revenue (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 50000"
                    value={campRevenue}
                    onChange={(e) => setCampRevenue(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Campaign Status
                  </label>
                  <select
                    value={campStatus}
                    onChange={(e) => setCampStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none bg-slate-50"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdSpendModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingCamp}
                  className="px-5 py-2 text-xs font-bold text-white bg-(--color-brand-green) hover:bg-(--color-brand-green-hover) rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingCamp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isSavingCamp ? "Saving..." : "Save Financial Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
