import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import BroadcastCampaign from "@/models/BroadcastCampaign";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const campaign = await BroadcastCampaign.findById(id)
      .populate("createdBy", "name email")
      .populate("recipientLogs.leadId", "fullName phone business city leadCustomId");

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error) {
    console.error("GET Campaign Error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign details" }, { status: 500 });
  }
}
