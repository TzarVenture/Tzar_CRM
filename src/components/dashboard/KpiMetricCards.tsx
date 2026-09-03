"use client";

import React from "react";
import { TrendingUp, ArrowUpRight, DollarSign, Users, CheckCircle2, Award } from "lucide-react";

interface KpiMetricCardsProps {
  totalRevenue: number;
  totalLeads: number;
  closedWonCount: number;
  closedWonValue: number;
  conversionRate: number;
  activeClientsCount: number;
}

export function KpiMetricCards({
  totalRevenue,
  totalLeads,
  closedWonCount,
  closedWonValue,
  conversionRate,
  activeClientsCount,
}: KpiMetricCardsProps) {
  const cards = [
    {
      title: "Total Pipeline Revenue",
      value: `₹${(totalRevenue || 0).toLocaleString("en-IN")}`,
      delta: "+12.4%",
      deltaLabel: "vs last month",
      isPositive: true,
      sparklineHeights: [30, 45, 60, 40, 75, 90, 100],
      icon: DollarSign,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      title: "Total Inquiries & Leads",
      value: `${(totalLeads || 0).toLocaleString("en-IN")}`,
      delta: "+8.5%",
      deltaLabel: "inbound velocity",
      isPositive: true,
      sparklineHeights: [40, 55, 35, 70, 65, 85, 95],
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      title: "Closed Won Revenue",
      value: `₹${(closedWonValue || 0).toLocaleString("en-IN")}`,
      subValue: `${closedWonCount} Deals Closed`,
      delta: "+15.2%",
      deltaLabel: "conversion value",
      isPositive: true,
      sparklineHeights: [25, 40, 50, 65, 70, 80, 100],
      icon: Award,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      title: "Lead Conversion Rate",
      value: `${(conversionRate || 0).toFixed(1)}%`,
      subValue: `${activeClientsCount} Active Clients`,
      delta: "+3.1%",
      deltaLabel: "closing efficiency",
      isPositive: true,
      sparklineHeights: [50, 45, 60, 55, 75, 80, 90],
      icon: CheckCircle2,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
          >
            {/* Card Header: Title & Mini Bar Sparkline */}
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-slate-500">{card.title}</span>
              {/* Mini Sparkline Chart (BagUI Signature Style) */}
              <div className="flex items-end gap-1 h-5 w-12 justify-end opacity-70">
                {card.sparklineHeights.map((h, sIdx) => (
                  <div
                    key={sIdx}
                    className={`w-1 rounded-xs transition-all ${
                      sIdx === card.sparklineHeights.length - 1
                        ? "bg-slate-900"
                        : "bg-slate-300"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Main Value Display */}
            <div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {card.value}
              </div>
              {card.subValue && (
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  {card.subValue}
                </p>
              )}
            </div>

            {/* Bottom Trend Badge */}
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-0.5 font-bold text-[11px] px-2 py-0.5 rounded-full ${
                  card.isPositive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : "bg-rose-50 text-rose-700 border border-rose-200/80"
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                {card.delta}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{card.deltaLabel}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
