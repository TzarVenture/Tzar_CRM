"use client";

import React from "react";
import { TrendUp as TrendingUp, ArrowUpRight, CurrencyDollar as DollarSign, Users, CheckCircle as CheckCircle2, Medal as Award } from "@phosphor-icons/react";

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
      color: "text-success",
      bg: "bg-success-soft",
    },
    {
      title: "Total Inquiries & Leads",
      value: `${(totalLeads || 0).toLocaleString("en-IN")}`,
      delta: "+8.5%",
      deltaLabel: "new enquiries",
      isPositive: true,
      sparklineHeights: [40, 55, 35, 70, 65, 85, 95],
      icon: Users,
      color: "text-info",
      bg: "bg-info-soft",
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
      color: "text-foreground",
      bg: "bg-muted",
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
      color: "text-warning",
      bg: "bg-warning-soft",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        return (
          <div
            key={idx}
            className="bg-card p-5 rounded-2xl border border-border shadow-2xs hover:border-input transition-all flex flex-col justify-between space-y-4"
          >
            {/* Card Header: Title & Mini Bar Sparkline */}
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted-foreground">{card.title}</span>
            </div>


            {/* Main Value Display */}
            <div>
              <div className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {card.value}
              </div>
              {card.subValue && (
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {card.subValue}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
