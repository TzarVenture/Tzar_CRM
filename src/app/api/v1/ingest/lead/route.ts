import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug, LeadSource } from "@/models/Lead";
import Message from "@/models/Message";
import {
  getDefaultPipeline,
  getAssignedBDE,
  calculateLeadScore,
  generateLeadCustomId,
} from "@/lib/lead-utils";

const IngestLeadSchema = z.object({
  business: z.enum(["tzar", "adshalaa", "crownleaf", "titepo"]).default("tzar"),
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
    .default("WEBSITE_CONTACT"),
  fullName: z.string().optional(),
  fullname: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("Invalid email address").or(z.string().optional().default("")),
  phone: z.string().min(5, "Valid phone number is required"),
  companyName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  interestedServices: z.array(z.string()).or(z.string()).optional(),
  estimatedBudget: z.number().or(z.string()).optional(),
  requirementsMessage: z.string().optional(),
  message: z.string().optional(),
  requirmentmsg: z.string().optional(),

  // Brand-Specific Payloads
  tzarData: z
    .object({
      formType: z.enum(["CONTACT", "WEBDEV", "HIREUS", "PAYMENT"]).optional(),
      domain: z.string().optional(),
      internshipType: z.string().optional(),
      resumeUrl: z.string().optional(),
      checkboxConsent: z.string().optional(),
    })
    .optional(),

  adshalaaData: z
    .object({
      formType: z.enum(["ENQUIRY", "REGISTRATION", "WEBINAR", "BROCHURE", "CONTACT"]).optional(),
      programName: z.string().optional(),
      dob: z.string().optional(),
      professionalStatus: z.string().optional(),
      company: z.string().optional(),
      designation: z.string().optional(),
      experience: z.string().optional(),
      batch: z.string().optional(),
      goals: z.string().optional(),
      emergencyContact: z
        .object({
          name: z.string().optional(),
          relation: z.string().optional(),
          phone: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  crownleafData: z
    .object({
      giftingCategory: z.string().optional(),
      quantityUnits: z.number().optional(),
    })
    .optional(),

  titepoData: z
    .object({
      eventType: z.string().optional(),
      kidsCount: z.number().optional(),
    })
    .optional(),

  paymentData: z
    .object({
      amount: z.number().optional(),
      razorpayPaymentId: z.string().optional(),
      razorpayOrderId: z.string().optional(),
      paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]).optional(),
    })
    .optional(),

  metadata: z
    .object({
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      landingPageUrl: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  try {
    // 1. API Key Authentication
    const apiKey = req.headers.get("x-tzar-api-key");
    const expectedApiKey =
      process.env.TZAR_INGEST_API_KEY || "tzar_live_ingest_key_demo";

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid API Key" },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await req.json();
    const parseResult = IngestLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload format", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const rawData = parseResult.data;

    // Normalize Core Contact Info
    const fullName =
      rawData.fullName || rawData.fullname || rawData.name || "Anonymous Lead";
    const email = (rawData.email || "").toLowerCase().trim();
    const phone = (rawData.phone || "").trim();
    const business: BusinessSlug = rawData.business || "tzar";
    const source: LeadSource = rawData.source || "WEBSITE_CONTACT";
    const city = rawData.city || "";
    const country = rawData.country || "India";
    const requirementsMessage =
      rawData.requirementsMessage || rawData.message || rawData.requirmentmsg || "";

    let interestedServices: string[] = [];
    if (Array.isArray(rawData.interestedServices)) {
      interestedServices = rawData.interestedServices.filter(Boolean);
    } else if (typeof rawData.interestedServices === "string") {
      interestedServices = [rawData.interestedServices];
    }

    let estimatedBudget = 0;
    if (typeof rawData.estimatedBudget === "number") {
      estimatedBudget = rawData.estimatedBudget;
    } else if (typeof rawData.estimatedBudget === "string") {
      estimatedBudget = parseFloat(rawData.estimatedBudget) || 0;
    }

    await dbConnect();

    // 3. Deduplication Check (Same phone or email within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await Lead.findOne({
      business,
      status: "ACTIVE",
      createdAt: { $gte: thirtyDaysAgo },
      $or: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingLead) {
      existingLead.score += 15;
      if (requirementsMessage) {
        existingLead.requirementsMessage = existingLead.requirementsMessage
          ? `${existingLead.requirementsMessage}\n\n[Re-engagement update]: ${requirementsMessage}`
          : requirementsMessage;
      }
      if (interestedServices.length > 0) {
        existingLead.interestedServices = Array.from(
          new Set([...existingLead.interestedServices, ...interestedServices])
        );
      }
      await existingLead.save();

      await Message.create({
        leadId: existingLead._id,
        channel: "SYSTEM_NOTE",
        direction: "INBOUND",
        content: `Lead re-engaged from website form (${source}). Message: ${requirementsMessage || "N/A"}`,
        status: "DELIVERED",
      });

      return NextResponse.json(
        {
          status: "updated",
          message: `Existing active lead found for ${business.toUpperCase()}. Updated engagement timeline.`,
          leadId: existingLead._id.toString(),
          leadCustomId: existingLead.leadCustomId,
        },
        { status: 200 }
      );
    }

    // 4. Create New Multi-Brand Lead
    const pipeline = await getDefaultPipeline();
    const assignedTo = await getAssignedBDE();
    const leadCustomId = await generateLeadCustomId(business);
    const score = calculateLeadScore({
      estimatedBudget,
      phone,
      interestedServices,
    });

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 24);

    const newLead = await Lead.create({
      leadCustomId,
      business,
      fullName,
      email,
      phone,
      companyName: rawData.companyName || "",
      city,
      country,
      pincode: rawData.pincode || "",
      source,
      interestedServices,
      estimatedBudget,
      requirementsMessage,
      pipelineId: pipeline._id,
      stageId: "new-lead",
      assignedTo,
      score,
      status: "ACTIVE",
      slaDeadline,
      tzarData: rawData.tzarData,
      adshalaaData: rawData.adshalaaData,
      crownleafData: rawData.crownleafData,
      titepoData: rawData.titepoData,
      paymentData: rawData.paymentData,
      utmData: rawData.metadata,
      syncedFrom: "NEXTJS_API",
    });

    await Message.create({
      leadId: newLead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      content: `New lead ingested for brand [${business.toUpperCase()}] via ${source}. Initial message: "${requirementsMessage || "N/A"}"`,
      status: "DELIVERED",
    });

    return NextResponse.json(
      {
        status: "created",
        message: `Lead successfully ingested for ${business.toUpperCase()}!`,
        leadId: newLead._id.toString(),
        leadCustomId: newLead.leadCustomId,
        business: newLead.business,
        score: newLead.score,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Multi-Brand Lead Ingest Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error during multi-brand lead ingestion", details: String(error) },
      { status: 500 }
    );
  }
}

