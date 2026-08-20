import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug, LeadSource } from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";
import {
  getDefaultPipeline,
  getAssignedBDE,
  calculateLeadScore,
  generateLeadCustomId,
} from "@/lib/lead-utils";

const CreateManualLeadSchema = z.object({
  business: z.enum(["tzar", "adshalaa", "crownleaf", "titepo"]).default("tzar"),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone is required"),
  companyName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  source: z
    .enum([
      "WEBSITE_CONTACT",
      "WEBSITE_WEBDEV",
      "WEBSITE_HIREUS",
      "WEBSITE_ENQUIRY",
      "WEBSITE_REGISTRATION",
      "WEBSITE_WEBINAR",
      "WEBSITE_BROCHURE",
      "META_LEAD_AD",
      "GOOGLE_SHEETS_SYNC",
      "WHATSAPP_INBOUND",
      "MANUAL",
    ])
    .default("MANUAL"),
  interestedServices: z.array(z.string()).optional().default([]),
  estimatedBudget: z.number().optional().default(0),
  requirementsMessage: z.string().optional(),
  assignedTo: z.string().optional(),
});

// GET: Fetch all active leads for Kanban or list
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const service = searchParams.get("service");
    const assignedTo = searchParams.get("assignedTo");
    const business = searchParams.get("business");

    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      status: "ACTIVE",
    };

    if (business && business !== "all") {
      filter.business = business;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { leadCustomId: { $regex: search, $options: "i" } },
      ];
    }

    if (service) {
      filter.interestedServices = service;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email avatarUrl role")
      .sort({ createdAt: -1 });

    return NextResponse.json({ leads }, { status: 200 });
  } catch (error) {
    console.error("GET Leads Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

// POST: Add Manual Lead from CRM
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CreateManualLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    await dbConnect();

    const pipeline = await getDefaultPipeline();
    const assignedToId = data.assignedTo || (await getAssignedBDE());
    const business: BusinessSlug = data.business || "tzar";
    const leadCustomId = await generateLeadCustomId(business);
    const score = calculateLeadScore({
      estimatedBudget: data.estimatedBudget,
      phone: data.phone,
      interestedServices: data.interestedServices,
    });

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 24);

    const newLead: any = await Lead.create({
      leadCustomId,
      business,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      companyName: data.companyName,
      city: data.city,
      country: data.country,
      source: data.source as LeadSource,
      interestedServices: data.interestedServices,
      estimatedBudget: data.estimatedBudget,
      requirementsMessage: data.requirementsMessage,
      pipelineId: pipeline._id,
      stageId: "new-lead",
      assignedTo: assignedToId,
      score,
      status: "ACTIVE",
      slaDeadline,
    });

    await Message.create({
      leadId: newLead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      content: `Manual lead created by ${session.user.name || session.user.email}. Message: "${data.requirementsMessage || "N/A"}"`,
      status: "DELIVERED",
    });

    const populatedLead = await Lead.findById(newLead._id).populate(
      "assignedTo",
      "name email avatarUrl role"
    );

    return NextResponse.json({ lead: populatedLead }, { status: 201 });
  } catch (error) {
    console.error("POST Manual Lead Error:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}

