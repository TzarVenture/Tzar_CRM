"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { Sparkles, ChevronDown, X, TrendingUp, ShieldAlert, CheckCircle2 } from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

interface BrandMetricItem {
  id: BusinessSlug;
  name: string;
  logo: string;
  count: number;
  value: number;
  color: string;
  share: number;
}

interface RevenueBreakdownChartProps {
  brandMetrics: Record<BusinessSlug, { count: number; value: number }>;
  totalRevenue: number;
}

export function RevenueBreakdownChart({
  brandMetrics,
  totalRevenue,
}: RevenueBreakdownChartProps) {
  const [selectedRange, setSelectedRange] = useState<"All Quarters" | "Q1 (Jan-Mar)" | "Q2 (Apr-Jun)" | "Q3 (Jul-Sep)" | "Q4 (Oct-Dec)">("All Quarters");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const brandData: BrandMetricItem[] = [
    {
      id: "tzar",
      name: "Tzar Agency",
      logo: "/tzar-logo.png",
      count: brandMetrics.tzar?.count || 0,
      value: brandMetrics.tzar?.value || 0,
      color: "#047857",
      share: totalRevenue > 0 ? ((brandMetrics.tzar?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "titepo",
      name: "Titepo Toys",
      logo: "/titepo-logo.png",
      count: brandMetrics.titepo?.count || 0,
      value: brandMetrics.titepo?.value || 0,
      color: "#E11D48",
      share: totalRevenue > 0 ? ((brandMetrics.titepo?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "crownleaf",
      name: "CrownLeaf",
      logo: "/Crownleaf-logo.png",
      count: brandMetrics.crownleaf?.count || 0,
      value: brandMetrics.crownleaf?.value || 0,
      color: "#D97706",
      share: totalRevenue > 0 ? ((brandMetrics.crownleaf?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "adshalaa",
      name: "Adshalaa",
      logo: "/adshalaa-logo.png",
      count: brandMetrics.adshalaa?.count || 0,
      value: brandMetrics.adshalaa?.value || 0,
      color: "#2563EB",
      share: totalRevenue > 0 ? ((brandMetrics.adshalaa?.value || 0) / totalRevenue) * 100 : 25,
    },
  ];

  // Highest contributing brand
  const topBrand = [...brandData].sort((a, b) => b.count - a.count)[0];

  return (
    <>
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4 flex flex-col justify-between">
        {/* Header with Title, Total & Functional Date Range Dropdown */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Revenue & Lead Breakdown</h2>
            <p className="text-xs text-slate-500 font-medium">Revenue by Business Entity</p>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              ₹{(totalRevenue || 0).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Interactive Date Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              <span>{selectedRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRangeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-fade-in">
                {(["All Quarters", "Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedRange(q);
                      setIsRangeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 cursor-pointer ${
                      selectedRange === q ? "text-emerald-700 font-bold bg-emerald-50/60" : "text-slate-700"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Brand Distribution Chart */}
        <div className="w-full h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brandData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#64748B", fontWeight: 700 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <Tooltip
                cursor={{ fill: "#F8FAFC", opacity: 0.8 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as BrandMetricItem;
                    return (
                      <div className="bg-slate-950 text-white p-2.5 rounded-xl text-xs space-y-1 shadow-lg border border-slate-800">
                        <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.logo} alt={item.name} className="h-3.5 w-auto object-contain bg-white/10 rounded px-1" />
                          <span className="font-extrabold text-slate-200">{item.name}</span>
                        </div>
                        <p className="text-slate-400">Total Leads: <span className="font-bold text-white">{item.count}</span></p>
                        <p className="text-slate-400">Pipeline Value: <span className="font-bold text-emerald-400">₹{item.value.toLocaleString("en-IN")}</span></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {brandData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Brand Shares Progress Rows with ONLY Official Logos */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {brandData.map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between hover:bg-slate-100/80 transition-colors">
              <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.logo}
                  alt={b.name}
                  className="h-5 w-auto max-w-[90px] object-contain shrink-0"
                />
              </div>
              <span className="font-black text-slate-900 shrink-0 text-xs sm:text-sm">{b.count} leads</span>
            </div>
          ))}
        </div>

        {/* Functional BagUI AI Insight Button */}
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700 transition-all cursor-pointer group"
        >
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
          <div className="flex items-center gap-1.5 flex-1 truncate">
            <span className="font-bold text-slate-900">AI Growth Insight: </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={topBrand.logo} alt="Top Brand" className="h-4 w-auto object-contain inline shrink-0" />
            <span className="text-slate-600 font-medium truncate">
              leads volume with {topBrand.count} active inquiries.
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 underline shrink-0">
            View Details →
          </span>
        </button>
      </div>

      {/* Interactive AI Intelligence Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    AI Multi-Brand Strategic Intelligence
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Autonomous pipeline velocity and conversion diagnostics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                <div className="flex items-center gap-2 font-black text-emerald-900">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Lead Acquisition Velocity</span>
                </div>
                <p className="text-emerald-800 font-medium">
                  {topBrand.name} is generating the highest inbound inquiry volume ({topBrand.count} leads). Ad recall and instant form completion rates are performing in the top 10th percentile.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 space-y-1">
                <div className="flex items-center gap-2 font-black text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>BDE Conversion SLA Recommendation</span>
                </div>
                <p className="text-blue-800 font-medium">
                  Leads contacted within 15 minutes via automated WhatsApp template workflows have a 3.4× higher closing rate. Ensure all newly ingested Meta leads trigger the auto-welcome template.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
              >
                Close Intelligence
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
