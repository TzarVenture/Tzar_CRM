import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MetaInsight from "@/models/MetaInsight";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch real campaigns managed in MongoDB
    const insights = await MetaInsight.find().sort({ spend: -1 });

    // Compute aggregate KPIs
    const totalAdSpend = insights.reduce((sum, c) => sum + (c.spend || 0), 0);
    const totalLeadsCaptured = insights.reduce((sum, c) => sum + (c.leadsCaptured || 0), 0);
    const avgCpl = totalLeadsCaptured > 0 ? totalAdSpend / totalLeadsCaptured : 0;
    const totalRevenue = insights.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json().catch(() => ({}));

    // If payload contains campaign financial data to save/update
    if (body && body.campaignName && typeof body.spend === "number") {
      const campaignId = body.campaignId || `cmp_${Date.now()}`;
      const spend = body.spend || 0;
      const leadsCaptured = body.leadsCaptured || 0;
      const wonDeals = body.wonDeals || 0;
      const revenueGenerated = body.revenueGenerated || 0;
      const cpl = leadsCaptured > 0 ? spend / leadsCaptured : 0;
      const roas = spend > 0 ? revenueGenerated / spend : 0;

      const campaign = await MetaInsight.findOneAndUpdate(
        { campaignId },
        {
          campaignId,
          campaignName: body.campaignName,
          adAccountId: body.adAccountId || "act_10987654321",
          status: body.status || "ACTIVE",
          spend,
          impressions: body.impressions || 10000,
          clicks: body.clicks || 500,
          ctr: body.ctr || 2.5,
          cpl,
          leadsCaptured,
          wonDeals,
          revenueGenerated,
          roas,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      return NextResponse.json(
        { status: "success", message: "Campaign financial data saved successfully!", campaign },
        { status: 200 }
      );
    }

    // Default resync touch
    await MetaInsight.updateMany({}, { lastSyncedAt: new Date() });

    return NextResponse.json(
      { status: "success", message: "Meta Ads insights successfully resynced." },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST Meta Ads Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to save or sync Meta Ads financial data" },
      { status: 500 }
    );
  }
}
