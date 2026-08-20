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
} from "lucide-react";
import { format } from "date-fns";

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Controls Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white font-bold"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Meta Lead Ads Performance Engine
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Graph API v19.0 Integration · Direct Campaign ROI & Attribution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Selector */}
          <div className="relative flex items-center">
            <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 outline-none cursor-pointer"
            >
              <option value="this_month">This Month</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="this_quarter">This Quarter</option>
              <option value="year_to_date">Year to Date</option>
            </select>
          </div>

          {/* Sync CTA */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 hover:bg-(--color-brand-green-hover)"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing Meta API..." : "Sync Graph API"}
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Ad Spend */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Ad Spend
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ${kpis.totalAdSpend.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Across connected Meta ad accounts</p>
        </div>

        {/* Card 2: Total Leads Captured */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Meta Leads Captured
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-(--color-brand-green)">
            {kpis.totalLeadsCaptured}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Ingested into CRM pipeline</p>
        </div>

        {/* Card 3: Avg Cost Per Lead */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Average CPL
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            ${kpis.avgCpl.toFixed(2)}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Cost Per Ingested Lead</p>
        </div>

        {/* Card 4: Est Revenue / ROAS */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
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
            ${kpis.totalRevenue.toLocaleString()} closed revenue
          </p>
        </div>
      </div>

      {/* Campaign Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-(--color-brand-green)" />
            <h3 className="text-sm font-bold text-slate-900">
              Campaign Attribution Matrix
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {campaigns.length} Connected Meta Campaigns
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Campaign Name</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Ad Spend</th>
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
                      ${c.spend.toLocaleString()}
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
                      ${c.cpl.toFixed(2)}
                    </td>
                    <td className="py-4 px-4 font-bold text-emerald-700">
                      ${c.revenueGenerated.toLocaleString()}
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
    </div>
  );
}
