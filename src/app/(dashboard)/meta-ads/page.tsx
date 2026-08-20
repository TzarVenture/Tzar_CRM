import type { Metadata } from "next";
import MetaAdsDashboard from "@/components/meta/MetaAdsDashboard";

export const metadata: Metadata = {
  title: "Meta Ads Analytics",
};

export default function MetaAdsPage() {
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
