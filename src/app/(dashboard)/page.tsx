import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Award,
  ArrowRight,
  DollarSign,
  Building2,
  Clock,
  AlertTriangle,
  Briefcase,
  BookOpen,
  Gift,
  ShoppingBag,
  ShieldCheck,
  Send,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

export const metadata: Metadata = { title: "Dashboard Overview" };

export const revalidate = 0; // Fresh real-time data

export default async function DashboardPage() {
  await dbConnect();
  const session = await auth();

  const userRole = session?.user?.role || "SUPER_ADMIN";
  const userId = session?.user?.id;
  const userName = session?.user?.name || "Team Member";

  // Global Multi-Brand Metrics
  const activeLeads = await Lead.find({ status: "ACTIVE" }).lean();
  const totalLeadsCount = activeLeads.length;
  const totalClientsCount = await Client.countDocuments();

  const totalPipelineValue = activeLeads.reduce(
    (sum, lead) => sum + (lead.estimatedBudget || 0),
    0
  );

  const closedWonLeads = await Lead.find({ stageId: "closed-won" }).lean();
  const closedWonValue = closedWonLeads.reduce(
    (sum, lead) => sum + (lead.estimatedBudget || 0),
    0
  );

  // Brand-wise Breakdown Metrics
  const brandMetrics: Record<BusinessSlug, { count: number; value: number }> = {
    tzar: { count: 0, value: 0 },
    adshalaa: { count: 0, value: 0 },
    crownleaf: { count: 0, value: 0 },
    titepo: { count: 0, value: 0 },
  };

  activeLeads.forEach((l) => {
    const b = (l.business || "tzar") as BusinessSlug;
    if (brandMetrics[b]) {
      brandMetrics[b].count += 1;
      brandMetrics[b].value += l.estimatedBudget || 0;
    }
  });

  // Role-Specific Metrics for BDE
  const myAssignedLeads = activeLeads.filter(
    (l) => l.assignedTo && l.assignedTo.toString() === userId
  );
  const myOverdueLeads = myAssignedLeads.filter(
    (l) => l.slaDeadline && new Date(l.slaDeadline) < new Date()
  );
  const myClosedWon = closedWonLeads.filter(
    (l) => l.assignedTo && l.assignedTo.toString() === userId
  );
  const myWonValue = myClosedWon.reduce(
    (sum, l) => sum + (l.estimatedBudget || 0),
    0
  );

  // Team Leaderboard for Admin & Manager
  const bdeUsers = await User.find({ role: "BDE" }).lean();
  const teamLeaderboard = bdeUsers.map((user) => {
    const assigned = activeLeads.filter(
      (l) => l.assignedTo && l.assignedTo.toString() === user._id.toString()
    );
    const won = closedWonLeads.filter(
      (l) => l.assignedTo && l.assignedTo.toString() === user._id.toString()
    );
    const wonRev = won.reduce((sum, l) => sum + (l.estimatedBudget || 0), 0);

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      activeCount: assigned.length,
      wonCount: won.length,
      revenue: wonRev,
    };
  });

  return (
    <div className="animate-fade-in space-y-8">
      {/* ─── 1. DYNAMIC ROLE-BASED HEADER ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
              {userRole === "SUPER_ADMIN"
                ? "Super Admin / Agency Owner"
                : userRole === "SALES_MANAGER"
                ? "Sales Manager"
                : "BDE Sales Rep Workspace"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, {userName}!
          </h1>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            {userRole === "SUPER_ADMIN"
              ? "Enterprise overview across all 4 brands, team performance, and agency revenue metrics"
              : userRole === "SALES_MANAGER"
              ? "Sales team pipeline health, SLA breach alerts, and stage velocity tracking"
              : "Your active leads, SLA response countdowns, and sales targets"}
          </p>
        </div>

        <Link
          href="/pipeline"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        >
          Open Smart Lead Grid <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ─── 2. SUPER ADMIN VIEW (Full Enterprise Financials & CRUD) ──────── */}
      {userRole === "SUPER_ADMIN" && (
        <div className="space-y-8">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Active Pipeline
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                ₹{totalPipelineValue.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {totalLeadsCount} active leads across 4 brands
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Closed Won Revenue
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-600">
                ₹{closedWonValue.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                {closedWonLeads.length} converted deals
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Converted Clients
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {totalClientsCount}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Active client onboardings
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Team Reps (BDEs)
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {bdeUsers.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Active sales representatives
              </p>
            </div>
          </div>

          {/* 4 Brand Breakdown Cards */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Brand Entity Revenue & Pipeline Distribution
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-emerald-50/60 border border-emerald-200 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <Briefcase className="w-4 h-4 text-emerald-700" /> Tzar Agency
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{brandMetrics.tzar.value.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-emerald-800">
                  {brandMetrics.tzar.count} active leads
                </p>
              </div>

              <div className="bg-blue-50/60 border border-blue-200 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-blue-700" /> Adshalaa EdTech
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{brandMetrics.adshalaa.value.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-blue-800">
                  {brandMetrics.adshalaa.count} active course leads
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-200 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Gift className="w-4 h-4 text-amber-700" /> CrownLeaf Gifting
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{brandMetrics.crownleaf.value.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-amber-800">
                  {brandMetrics.crownleaf.count} active gifting leads
                </p>
              </div>

              <div className="bg-pink-50/60 border border-pink-200 p-5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-pink-900 font-bold text-xs uppercase tracking-wider">
                  <ShoppingBag className="w-4 h-4 text-pink-700" /> Titepo Kids Toys
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  ₹{brandMetrics.titepo.value.toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-pink-800">
                  {brandMetrics.titepo.count} active toy leads
                </p>
              </div>
            </div>
          </div>

          {/* Team Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-300 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Sales Rep (BDE) Performance Leaderboard
              </h2>

              <Link
                href="/team"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                Manage Team Members <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">BDE Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Active Leads</th>
                    <th className="py-3 px-4">Deals Won</th>
                    <th className="py-3 px-4">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {teamLeaderboard.map((bde) => (
                    <tr key={bde.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        {bde.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{bde.email}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {bde.activeCount}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {bde.wonCount}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        ₹{bde.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. BDE ROLE VIEW (Clean & Focused Workspace) ───────────────── */}
      {userRole === "BDE" && (
        <div className="space-y-8">
          {/* BDE Focused Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  My Assigned Leads
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">
                {myAssignedLeads.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Leads requiring outreach
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Overdue SLA Alerts
                </span>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-rose-600">
                {myOverdueLeads.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Leads exceeding 24h response SLA
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  My Monthly Target Progress
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700">
                ₹{myWonValue.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Target: ₹5,00,000 / month
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Deals Closed Won
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-amber-600">
                {myClosedWon.length}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Converted deals
              </p>
            </div>
          </div>

          {/* BDE Action Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-300 p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                My Priority Action Queue
              </h2>

              <Link
                href="/pipeline"
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                Open Smart Grid <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Lead ID</th>
                    <th className="py-3 px-4">Lead Name</th>
                    <th className="py-3 px-4">Phone / Email</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {myAssignedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No active leads assigned yet.
                      </td>
                    </tr>
                  ) : (
                    myAssignedLeads.slice(0, 5).map((lead: any) => (
                      <tr key={lead._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {lead.leadCustomId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {lead.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {lead.phone}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 uppercase">
                            {lead.business || "tzar"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800">
                            {lead.stageId || "new-lead"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`https://wa.me/${(lead.phone || "").replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-[11px] font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. SALES MANAGER VIEW ───────────────────────────────────────── */}
      {userRole === "SALES_MANAGER" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Team Pipeline</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">
                ₹{totalPipelineValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Across all sales reps</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">SLA Compliance Rate</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">94.2%</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">On-time first contact</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Closed Won Revenue</span>
              <p className="text-3xl font-extrabold text-amber-600 mt-2">
                ₹{closedWonValue.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Deals finalized</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
