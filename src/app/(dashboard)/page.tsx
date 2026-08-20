import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import Link from "next/link";
import {
  KanbanSquare,
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  BarChart3,
  DollarSign,
  Building2,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = { title: "Executive Dashboard" };

export default async function DashboardPage() {
  await dbConnect();

  const totalLeads = await Lead.countDocuments({ status: "ACTIVE" });
  const totalClients = await Client.countDocuments();

  const activeLeads = await Lead.find({ status: "ACTIVE" });
  const totalPipelineValue = activeLeads.reduce(
    (sum, lead) => sum + (lead.estimatedBudget || 0),
    0
  );

  const closedWonLeads = await Lead.countDocuments({ stageId: "closed-won" });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-300">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Overview
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            Real-time performance indicators and sales pipeline metrics
          </p>
        </div>

        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        >
          Open Sales Pipeline <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Leads */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Active Opportunities
            </span>
            <div className="p-2.5 rounded-xl bg-(--color-brand-green-light)">
              <Users className="w-5 h-5 text-(--color-brand-green)" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {totalLeads}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Active in pipeline</p>
        </div>

        {/* Total Pipeline Value */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Total Pipeline Value
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-(--color-brand-green)">
            ${totalPipelineValue.toLocaleString()}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Combined estimated value</p>
        </div>

        {/* Active Clients */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Client Accounts
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">
            {totalClients}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Converted agency clients</p>
        </div>

        {/* Deals Closed */}
        <div
          className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Closed Won Deals
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50">
              <Award className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">
            {closedWonLeads}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Closed opportunities</p>
        </div>
      </div>

      {/* Quick Launch Action Card */}
      <div
        className="p-7 bg-white rounded-2xl border border-slate-300 flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs"
      >
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <KanbanSquare className="w-5 h-5 text-(--color-brand-green)" />
            <h2 className="text-lg font-bold text-slate-900">
              Sales Kanban Pipeline Board
            </h2>
          </div>
          <p className="text-xs font-semibold text-slate-600">
            Drag-and-drop lead management, stage transitions, SLA tracking, and quick outreach.
          </p>
        </div>

        <Link
          href="/pipeline"
          className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        >
          Open Sales Pipeline Board <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
