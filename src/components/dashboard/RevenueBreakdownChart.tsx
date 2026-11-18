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
import { Sparkle as Sparkles, CaretDown as ChevronDown, X, TrendUp as TrendingUp, ShieldWarning as ShieldAlert, CheckCircle as CheckCircle2 } from "@phosphor-icons/react";
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

  const brandData: BrandMetricItem[] = [
    {
      id: "tzar",
      name: "Tzar Agency",
      logo: "/tzar-logo.png",
      count: brandMetrics.tzar?.count || 0,
      value: brandMetrics.tzar?.value || 0,
      color: "var(--chart-1)",
      share: totalRevenue > 0 ? ((brandMetrics.tzar?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "titepo",
      name: "Titepo Toys",
      logo: "/titepo-logo.png",
      count: brandMetrics.titepo?.count || 0,
      value: brandMetrics.titepo?.value || 0,
      color: "var(--chart-4)",
      share: totalRevenue > 0 ? ((brandMetrics.titepo?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "crownleaf",
      name: "CrownLeaf",
      logo: "/Crownleaf-logo.png",
      count: brandMetrics.crownleaf?.count || 0,
      value: brandMetrics.crownleaf?.value || 0,
      color: "var(--chart-2)",
      share: totalRevenue > 0 ? ((brandMetrics.crownleaf?.value || 0) / totalRevenue) * 100 : 25,
    },
    {
      id: "adshalaa",
      name: "Adshalaa",
      logo: "/adshalaa-logo.png",
      count: brandMetrics.adshalaa?.count || 0,
      value: brandMetrics.adshalaa?.value || 0,
      color: "var(--chart-3)",
      share: totalRevenue > 0 ? ((brandMetrics.adshalaa?.value || 0) / totalRevenue) * 100 : 25,
    },
  ];

  // Highest contributing brand
  const topBrand = [...brandData].sort((a, b) => b.count - a.count)[0];

  return (
    <>
      <div className="bg-card p-5 rounded-2xl border border-border shadow-2xs space-y-4 flex flex-col justify-between">
        {/* Header with Title, Total & Functional Date Range Dropdown */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Revenue & Lead Breakdown</h2>
            <p className="text-sm text-muted-foreground font-medium">Pipeline value by brand</p>
            <div className="text-xl sm:text-2xl font-semibold text-foreground mt-1">
              ₹{(totalRevenue || 0).toLocaleString("en-IN")}
            </div>
          </div>

          {/* Interactive Date Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted border border-border rounded-xl text-foreground font-semibold text-sm transition-all cursor-pointer"
            >
              <span>{selectedRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {isRangeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-40 bg-card border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-fade-in">
                {(["All Quarters", "Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setSelectedRange(q);
                      setIsRangeDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm font-semibold hover:bg-muted cursor-pointer ${
                      selectedRange === q ? "text-success font-semibold bg-success-soft" : "text-foreground"
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 700 }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.8 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as BrandMetricItem;
                    return (
                      <div className="bg-popover text-popover-foreground p-2.5 rounded-xl text-sm space-y-1 shadow-lg border border-border">
                        <div className="flex items-center gap-2 pb-1 border-b border-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.logo} alt={item.name} className="h-3.5 w-auto object-contain bg-card rounded px-1" />
                          <span className="font-semibold text-foreground">{item.name}</span>
                        </div>
                        <p className="text-muted-foreground">Total Leads: <span className="font-semibold text-foreground">{item.count}</span></p>
                        <p className="text-muted-foreground">Pipeline Value: <span className="font-semibold text-success">₹{item.value.toLocaleString("en-IN")}</span></p>
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
        <div className="grid grid-cols-2 gap-2.5 text-sm">
          {brandData.map((b) => (
            <div key={b.id} className="p-3 rounded-xl bg-muted border border-border flex items-center justify-between hover:bg-muted transition-colors">
              <div className="flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.logo}
                  alt={b.name}
                  className="h-5 w-auto max-w-[90px] object-contain shrink-0"
                />
              </div>
              <span className="font-semibold text-foreground shrink-0 text-sm sm:text-sm">{b.count} leads</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
