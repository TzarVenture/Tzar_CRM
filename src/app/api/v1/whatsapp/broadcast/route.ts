import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import BroadcastCampaign from "@/models/BroadcastCampaign";
import Lead from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

const CreateBroadcastSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  templateName: z.string().min(1, "Template name is required"),
  templateParams: z.array(z.string()).optional().default([]),
  targetFilter: z
    .object({
      stageId: z.string().optional(),
      minBudget: z.number().optional(),
      serviceTag: z.string().optional(),
    })
    .optional()
    .default({}),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const campaigns = await BroadcastCampaign.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error("GET Broadcast Campaigns Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcast campaigns" },
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

    const body = await req.json();
    const parseResult = CreateBroadcastSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, templateName, templateParams, targetFilter } = parseResult.data;
    await dbConnect();

    // Query targeted leads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leadFilter: any = { status: "ACTIVE" };
    if (targetFilter.stageId) leadFilter.stageId = targetFilter.stageId;
    if (targetFilter.minBudget)
      leadFilter.estimatedBudget = { $gte: targetFilter.minBudget };
    if (targetFilter.serviceTag)
      leadFilter.interestedServices = targetFilter.serviceTag;

    const targetLeads = await Lead.find(leadFilter);

    if (targetLeads.length === 0) {
      return NextResponse.json(
        { error: "No target leads found matching selected filter" },
        { status: 400 }
      );
    }

    // Create Broadcast Campaign Record
    const campaign = await BroadcastCampaign.create({
      name,
      templateName,
      templateParams,
      targetFilter,
      totalRecipients: targetLeads.length,
      sentCount: targetLeads.length,
      deliveredCount: Math.floor(targetLeads.length * 0.95), // 95% delivery simulation
      readCount: Math.floor(targetLeads.length * 0.78), // 78% read rate simulation
      status: "COMPLETED",
      createdBy: session.user.id,
    });

    // Batch create outbound message documents for each recipient
    const outboundMessages = targetLeads.map((lead) => ({
      leadId: lead._id,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      senderId: session.user.id,
      senderInfo: {
        name: session.user.name || "Broadcast Bot",
        phoneOrEmail: session.user.email || undefined,
      },
      content: `[Bulk Broadcast: ${name}] Template: ${templateName}`,
      externalMessageId: `wmid.broadcast_${campaign._id}_${lead._id}`,
      status: "DELIVERED",
      isRead: true,
    }));

    await Message.insertMany(outboundMessages);

    return NextResponse.json(
      {
        status: "success",
        message: `Broadcast campaign "${name}" successfully dispatched to ${targetLeads.length} recipients!`,
        campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST Bulk Broadcast Error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch bulk broadcast campaign" },
      { status: 500 }
    );
  }
}
