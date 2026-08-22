import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug } from "@/models/Lead";
import Message from "@/models/Message";
import {
  getDefaultPipeline,
  getAssignedBDE,
  calculateLeadScore,
  generateLeadCustomId,
} from "@/lib/lead-utils";

/**
 * 1. GET: Verification Handler for Meta Webhook Setup
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const allowedTokens = [
    process.env.META_VERIFY_TOKEN,
    process.env.WHATSAPP_VERIFY_TOKEN,
    "tzar_meta_webhook_verify_token_2026",
    "tzar_whatsapp_webhook_verify_token_2026",
  ].filter(Boolean);

  if (mode === "subscribe" && token && allowedTokens.includes(token)) {
    console.log("✅ Meta Lead Ads Webhook verified successfully!");
    return new Response(challenge || "OK", { status: 200 });
  }

  return new Response("Forbidden: Invalid Verify Token", { status: 403 });
}

/**
 * 2. POST: Meta Lead Ads Ingestion Listener (leadgen event)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change) {
      return NextResponse.json({ status: "ignored", reason: "no leadgen change payload" });
    }

    const pageId = entry?.id || change?.page_id || "";
    const leadgenId = change?.leadgen_id;
    const adId = change?.ad_id || "meta_ad_direct";
    const formId = change?.form_id || "meta_form_direct";

    // Page ID to Business Entity Mapping
    // (Update Page IDs when you connect real Facebook Pages)
    const pageToBusinessMap: Record<string, BusinessSlug> = {
      // "123456789": "crownleaf",
      // "987654321": "titepo",
      // "112233445": "adshalaa",
      // "556677889": "tzar",
    };

    let business: BusinessSlug = pageToBusinessMap[pageId] || "tzar";

    // If form details indicate specific brand
    if (formId.toLowerCase().includes("titepo") || body.business === "titepo") business = "titepo";
    if (formId.toLowerCase().includes("crown") || body.business === "crownleaf") business = "crownleaf";
    if (formId.toLowerCase().includes("adshala") || body.business === "adshalaa") business = "adshalaa";

    let fullName = "Meta Lead Ad Contact";
    let email = `lead_${Date.now()}@meta-campaign.com`;
    let phone = "+91 98765 00000";
    let companyName = "";
    let city = "";
    let campaignName = "Meta Lead Ads Campaign 2026";
    let adName = "Lead Gen Form Ad";

    const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN || process.env.META_SYSTEM_USER_TOKEN;

    // Fetch full field data from Meta Graph API if Access Token configured
    if (leadgenId && pageAccessToken && pageAccessToken.startsWith("EAA")) {
      try {
        const metaRes = await axios.get(
          `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`
        );

        if (metaRes.data?.field_data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          metaRes.data.field_data.forEach((field: any) => {
            const name = field.name?.toLowerCase();
            const val = field.values?.[0];
            if (name.includes("full_name") || name.includes("name")) fullName = val;
            if (name.includes("email")) email = val;
            if (name.includes("phone")) phone = val;
            if (name.includes("company")) companyName = val;
            if (name.includes("city")) city = val;
          });
        }
      } catch (graphErr: unknown) {
        console.error("Meta Graph API Lead Fetch Warning (Using payload fallbacks):", graphErr);
      }
    } else if (change.field_data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      change.field_data.forEach((field: any) => {
        const name = field.name?.toLowerCase();
        const val = field.values?.[0];
        if (name.includes("full_name") || name.includes("name")) fullName = val;
        if (name.includes("email")) email = val;
        if (name.includes("phone")) phone = val;
        if (name.includes("company")) companyName = val;
        if (name.includes("city")) city = val;
      });
    }

    // 30-day deduplication check
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const existingLead = await Lead.findOne({
      business,
      status: "ACTIVE",
      createdAt: { $gte: thirtyDaysAgo },
      $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }],
    });

    if (existingLead) {
      existingLead.score += 15;
      await existingLead.save();

      await Message.create({
        leadId: existingLead._id,
        channel: "SYSTEM_NOTE",
        direction: "INBOUND",
        content: `Lead re-engaged via Meta Lead Ad campaign: "${campaignName}" (${adName})`,
        status: "DELIVERED",
      });

      return NextResponse.json(
        { status: "updated", leadId: existingLead._id },
        { status: 200 }
      );
    }

    // Create New Multi-Brand Lead from Meta Ad
    const pipeline = await getDefaultPipeline();
    const assignedTo = await getAssignedBDE();
    const leadCustomId = await generateLeadCustomId(business);
    const score = calculateLeadScore({
      phone,
      interestedServices: ["Meta Lead Ad Inquiry"],
    });

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 24);

    const newLead = await Lead.create({
      leadCustomId,
      business,
      fullName,
      email: email.toLowerCase(),
      phone,
      companyName,
      city,
      source: "META_LEAD_AD",
      interestedServices: ["Meta Lead Ad Form"],
      pipelineId: pipeline._id,
      stageId: "new-lead",
      assignedTo,
      score,
      status: "ACTIVE",
      slaDeadline,
      metaAdDetails: {
        adId,
        adName,
        campaignId: "cmp_meta_2026",
        campaignName,
        formId,
        pageId,
      },
      syncedFrom: "META_WEBHOOK",
    });

    await Message.create({
      leadId: newLead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      content: `Instant Meta Lead Ad Ingestion for brand [${business.toUpperCase()}] from campaign "${campaignName}" (Page ID: ${pageId || "Default"})`,
      status: "DELIVERED",
    });

    console.log(`🎯 Meta Lead Ad ingested for ${business.toUpperCase()}: ${fullName} (${leadCustomId})`);

    return NextResponse.json(
      {
        status: "created",
        business: newLead.business,
        leadId: newLead._id.toString(),
        leadCustomId: newLead.leadCustomId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Meta Lead Ads Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Error in Meta Lead Ads Webhook", details: String(error) },
      { status: 500 }
    );
  }
}

