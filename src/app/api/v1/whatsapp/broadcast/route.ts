import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import BroadcastCampaign from "@/models/BroadcastCampaign";
import Lead from "@/models/Lead";
import { auth } from "@/lib/auth";
import { executeBroadcastCampaign } from "@/lib/whatsapp-broadcast-runner";

const CreateBroadcastSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  business: z.enum(["tzar", "titepo", "crownleaf", "adshalaa"]).optional(),
  templateName: z.string().min(1, "Template name is required"),
  templateLanguage: z.string().default("en_US"),
  templateParams: z.array(z.string()).optional().default([]),
  mediaAttachment: z
    .object({
      type: z.enum(["document", "image"]),
      url: z.string().min(1, "Media URL is required"),
      filename: z.string().optional(),
    })
    .optional(),
  targetFilter: z
    .object({
      business: z.string().optional(),
      stageId: z.string().optional(),
      minBudget: z.number().optional(),
      serviceTag: z.string().optional(),
      selectedLeadIds: z.array(z.string()).optional(),
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

    const {
      name,
      business,
      templateName,
      templateLanguage,
      templateParams,
      mediaAttachment,
      targetFilter,
    } = parseResult.data;

    await dbConnect();

    // Query targeted leads to count audience
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let leadFilter: any = { status: "ACTIVE" };

    if (targetFilter.selectedLeadIds && targetFilter.selectedLeadIds.length > 0) {
      leadFilter = { _id: { $in: targetFilter.selectedLeadIds } };
    } else {
      if (business || targetFilter.business) {
        leadFilter.business = business || targetFilter.business;
      }
      if (targetFilter.stageId) {
        leadFilter.stageId = targetFilter.stageId;
      }
      if (targetFilter.minBudget) {
        leadFilter.estimatedBudget = { $gte: targetFilter.minBudget };
      }
      if (targetFilter.serviceTag) {
        leadFilter.interestedServices = targetFilter.serviceTag;
      }
    }

    const recipientCount = await Lead.countDocuments(leadFilter);

    if (recipientCount === 0) {
      return NextResponse.json(
        { error: "No target leads found matching selected filter" },
        { status: 400 }
      );
    }

    // Create Broadcast Campaign Record in QUEUED state
    const campaign = await (BroadcastCampaign as any).create({
      name,
      business: business || targetFilter.business,
      templateName,
      templateLanguage,
      templateParams,
      mediaAttachment,
      targetFilter: {
        business: targetFilter.business,
        stageId: targetFilter.stageId,
        minBudget: targetFilter.minBudget,
        serviceTag: targetFilter.serviceTag,
        selectedLeadIds: targetFilter.selectedLeadIds,
      },
      totalRecipients: recipientCount,
      sentCount: 0,
      deliveredCount: 0,
      failedCount: 0,
      readCount: 0,
      status: "QUEUED",
      createdBy: session.user.id,
    });

    const campaignId = (campaign as any)._id?.toString() || "";
    if (campaignId) {
      executeBroadcastCampaign(campaignId).catch((err) => {
        console.error(`Error in broadcast runner for ${campaignId}:`, err);
      });
    }

    return NextResponse.json(
      {
        status: "success",
        message: `Broadcast campaign "${name}" queued for ${recipientCount} recipients. Dispatching via Meta Cloud API.`,
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
