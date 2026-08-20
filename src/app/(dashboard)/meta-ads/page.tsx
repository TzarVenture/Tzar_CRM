import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import MetaAdsDashboard from "@/components/meta/MetaAdsDashboard";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Meta Ads Analytics",
};

export default async function MetaAdsPage() {
  const session = await auth();

  if (session?.user?.role === "BDE") {
    return (
      <div className="p-12 text-center bg-rose-50/70 border border-rose-200 rounded-3xl space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">403 Access Forbidden</h2>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Meta Lead Ads ROI analytics and ad spend budgets are restricted to Managers and Admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Meta Lead Ads & Campaign Insights
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          Real-time Graph API ad spend, CPL, ROAS, and instant Meta lead form ingestion
        </p>
      </div>

      <MetaAdsDashboard />
    </div>
  );
}

