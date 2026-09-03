"use client";

import React, { useState } from "react";
import { OverviewHeader } from "./OverviewHeader";
import { KpiMetricCards } from "./KpiMetricCards";
import { SalesTrendChart } from "./SalesTrendChart";
import { RevenueBreakdownChart } from "./RevenueBreakdownChart";
import { RecentActivityTable } from "./RecentActivityTable";
import { CreateLeadModal } from "@/components/leads/CreateLeadModal";
import { BusinessSlug } from "@/models/Lead";

interface AdminDashboardViewProps {
  userName: string;
  userRole: string;
  totalLeads: number;
  totalRevenue: number;
  closedWonCount: number;
  closedWonValue: number;
  conversionRate: number;
  activeClientsCount: number;
  brandMetrics: Record<BusinessSlug, { count: number; value: number }>;
  monthlyTrend: {
    month: string;
    newLeads: number;
    closedWon: number;
    revenue: number;
  }[];
  recentLeads: {
    id: string;
    customId: string;
    name: string;
    email: string;
    phone: string;
    business: BusinessSlug;
    stageName: string;
    stageId: string;
    serviceOrProduct: string;
    qty: string;
    value: number;
    createdAt: string;
  }[];
}

export function AdminDashboardView({
  userName,
  userRole,
  totalLeads,
  totalRevenue,
  closedWonCount,
  closedWonValue,
  conversionRate,
  activeClientsCount,
  brandMetrics,
  monthlyTrend,
  recentLeads,
}: AdminDashboardViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. BagUI Header & Breadcrumbs & Welcome */}
      <OverviewHeader
        userName={userName}
        userRole={userRole}
        totalLeads={totalLeads}
        totalRevenue={totalRevenue}
      />

      {/* 2. Top 4 BagUI KPI Metric Cards */}
      <KpiMetricCards
        totalRevenue={totalRevenue}
        totalLeads={totalLeads}
        closedWonCount={closedWonCount}
        closedWonValue={closedWonValue}
        conversionRate={conversionRate}
        activeClientsCount={activeClientsCount}
      />

      {/* 3. 2-Column Responsive Chart Section (65% / 35% BagUI Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (65% width): Sales & Inbound Leads Trend Chart */}
        <div className="lg:col-span-8">
          <SalesTrendChart data={monthlyTrend} totalRevenue={totalRevenue} />
        </div>

        {/* Right Column (35% width): Multi-Brand Revenue & Lead Breakdown */}
        <div className="lg:col-span-4">
          <RevenueBreakdownChart
            brandMetrics={brandMetrics}
            totalRevenue={totalRevenue}
          />
        </div>
      </div>

      {/* 4. Bottom Full-Width Recent Deals & Activity Table */}
      <RecentActivityTable
        leads={recentLeads}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Create Lead Modal */}
      <CreateLeadModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLeadCreated={() => {
          setIsCreateModalOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
