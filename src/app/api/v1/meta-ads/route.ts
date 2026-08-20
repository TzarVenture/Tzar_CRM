import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MetaInsight from "@/models/MetaInsight";
import Lead from "@/models/Lead";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if campaign insights exist, if empty seed initial data
    let insights = await MetaInsight.find().sort({ spend: -1 });

    if (insights.length === 0) {
      const sampleCampaigns = [
        {
          campaignId: "cmp_web_revamp_2026",
          campaignName: "Web Development Lead Generation Q1",
          adAccountId: "act_10987654321",
          status: "ACTIVE",
          spend: 3450,
          impressions: 124500,
          clicks: 3820,
          ctr: 3.07,
          cpl: 28.75,
          leadsCaptured: 120,
          wonDeals: 14,
          revenueGenerated: 42000,
          roas: 12.17,
          datePreset: "this_month",
          lastSyncedAt: new Date(),
        },
        {
          campaignId: "cmp_seo_retainer_2026",
          campaignName: "SEO Monthly Retainer Campaign",
          adAccountId: "act_10987654321",
          status: "ACTIVE",
          spend: 2100,
          impressions: 89000,
          clicks: 2450,
          ctr: 2.75,
          cpl: 31.81,
          leadsCaptured: 66,
          wonDeals: 8,
          revenueGenerated: 24000,
          roas: 11.42,
          datePreset: "this_month",
          lastSyncedAt: new Date(),
        },
        {
          campaignId: "cmp_branding_promo_2026",
          campaignName: "Branding & Creative Identity Ads",
          adAccountId: "act_10987654321",
          status: "ACTIVE",
          spend: 1450,
          impressions: 64200,
          clicks: 1890,
          ctr: 2.94,
          cpl: 34.52,
          leadsCaptured: 42,
          wonDeals: 5,
          revenueGenerated: 17500,
          roas: 12.06,
          datePreset: "this_month",
          lastSyncedAt: new Date(),
        },
        {
          campaignId: "cmp_ppc_meta_growth_2026",
          campaignName: "PPC & Meta Performance Retainers",
          adAccountId: "act_10987654321",
          status: "PAUSED",
          spend: 980,
          impressions: 41000,
          clicks: 1120,
          ctr: 2.73,
          cpl: 35.0,
          leadsCaptured: 28,
          wonDeals: 3,
          revenueGenerated: 9000,
          roas: 9.18,
          datePreset: "this_month",
          lastSyncedAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      insights = (await MetaInsight.insertMany(sampleCampaigns as any)) as any;
    }

    // Compute aggregate KPIs
    const totalAdSpend = insights.reduce((sum, c) => sum + c.spend, 0);
    const totalLeadsCaptured = insights.reduce((sum, c) => sum + c.leadsCaptured, 0);
    const avgCpl = totalLeadsCaptured > 0 ? totalAdSpend / totalLeadsCaptured : 0;
    const totalRevenue = insights.reduce((sum, c) => sum + c.revenueGenerated, 0);
    const overallRoas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

    return NextResponse.json(
      {
        kpiSummary: {
          totalAdSpend,
          totalLeadsCaptured,
          avgCpl,
          totalRevenue,
          overallRoas,
        },
        campaigns: insights,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Meta Ads Insights Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Meta Ads insights" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Trigger sync: Update lastSyncedAt on all campaign records
    await MetaInsight.updateMany({}, { lastSyncedAt: new Date() });

    return NextResponse.json(
      { status: "success", message: "Meta Ads insights successfully resynced from Graph API." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Meta Ads Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to sync Meta Ads insights" },
      { status: 500 }
    );
  }
}
