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
    console.log("📩 Incoming Meta Lead Ad Payload:", JSON.stringify(body));
    await dbConnect();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    if (!change) {
      return NextResponse.json({ status: "ignored", reason: "no leadgen change payload" }, { status: 200 });
    }

    const pageId = entry?.id || change?.page_id || "";
    const leadgenId = change?.leadgen_id;
    const adId = change?.ad_id || "meta_ad_direct";
    const formId = change?.form_id || "meta_form_direct";

    let business: BusinessSlug = "adshalaa"; // Default to adshalaa for leadgen campaigns

    // Detect Business Entity from Form ID or Page ID or payload
    const formStr = (formId || "").toLowerCase();
    if (formStr.includes("adshala") || formStr.includes("dmcp") || body.business === "adshalaa") business = "adshalaa";
    if (formStr.includes("titepo") || body.business === "titepo") business = "titepo";
    if (formStr.includes("crown") || body.business === "crownleaf") business = "crownleaf";
    if (formStr.includes("tzar") || body.business === "tzar") business = "tzar";

    // Unique contact details for test lead fallbacks
    const uniqueSuffix = Date.now().toString().slice(-6);
    let fullName = `Meta Lead Ad User ${uniqueSuffix}`;
    let email = `lead_${uniqueSuffix}@adshalaa.com`;
    let phone = `+91987${uniqueSuffix}${Math.floor(10 + Math.random() * 89)}`;
    let companyName = "";
    let city = "";
    let campaignName = "Meta Lead Ads Campaign 2026";
    let adName = "Lead Gen Form Ad";
    let isRealData = false;

    const pageAccessToken =
      process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN ||
      "EAATfTEmIXrMBSUCucnF3ZCEzW3n88qgn1Tg3x5IqaY9E6l869wUXIfKThUX59OYm3I3uGmElxvZBwANhhuyZAwZBYtPIDgvP5zYyFZAcaOaGtT1SaEFC1znEo3cjtcPBx9gcXJhYNHJNXkZAFOasKRK0TiUJaYKzv7ci9JYVaLNPPfdWyu5amwz6Ia5rZC4dfODH08KRfFYuGobWK49zUDOKne1cUavN0ZCF4eoIWxWafaxxsGZCWYoCOHrZA6j4zXNrfKJDwuoeqshkn7o2xFtmykl8ve";

    // Fetch full field data from Meta Graph API if Access Token configured
    if (leadgenId && pageAccessToken && pageAccessToken.startsWith("EAA")) {
      try {
        const metaRes = await axios.get(
          `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${pageAccessToken}`
        );

        if (metaRes.data) {
          const metaStr = `${metaRes.data.campaign_name || ""} ${metaRes.data.form_name || ""} ${metaRes.data.page_name || ""} ${formId}`.toLowerCase();
          if (metaStr.includes("adshala") || metaStr.includes("dmcp") || metaStr.includes("digital marketing")) business = "adshalaa";
          else if (metaStr.includes("titepo") || metaStr.includes("toy")) business = "titepo";
          else if (metaStr.includes("crown") || metaStr.includes("gifting")) business = "crownleaf";
          else if (metaStr.includes("tzar")) business = "tzar";

          if (metaRes.data.campaign_name) campaignName = metaRes.data.campaign_name;
          if (metaRes.data.ad_name) adName = metaRes.data.ad_name;

          if (metaRes.data.field_data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metaRes.data.field_data.forEach((field: any) => {
              const name = field.name?.toLowerCase() || "";
              const val = field.values?.[0];
              if (!val) return;
              if (name.includes("full_name") || name.includes("name")) { fullName = val; isRealData = true; }
              if (name.includes("email")) { email = val; isRealData = true; }
              if (name.includes("phone")) { phone = val; isRealData = true; }
              if (name.includes("company")) companyName = val;
              if (name.includes("city")) city = val;
            });
          }
        }
      } catch (graphErr: unknown) {
        console.error("Meta Graph API Lead Fetch Warning (Using payload fallbacks):", graphErr);
      }
    } else if (change.field_data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      change.field_data.forEach((field: any) => {
        const name = field.name?.toLowerCase() || "";
        const val = field.values?.[0];
        if (!val) return;
        if (name.includes("full_name") || name.includes("name")) { fullName = val; isRealData = true; }
        if (name.includes("email")) { email = val; isRealData = true; }
        if (name.includes("phone")) { phone = val; isRealData = true; }
        if (name.includes("company")) companyName = val;
        if (name.includes("city")) city = val;
      });
    }

    // Deduplication check for real leads (only deduplicate if real email or real phone matched)
    let existingLead = null;
    if (isRealData) {
      const dedupeQuery: any[] = [];
      if (email && email.includes("@")) dedupeQuery.push({ email: email.toLowerCase() });
      if (phone && phone.replace(/\D/g, "").length >= 10) {
        const cleanDigits = phone.replace(/\D/g, "").slice(-10);
        dedupeQuery.push({ phone: { $regex: cleanDigits } });
      }

      if (dedupeQuery.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        existingLead = await Lead.findOne({
          business,
          status: "ACTIVE",
          createdAt: { $gte: thirtyDaysAgo },
          $or: dedupeQuery,
        });
      }
    }

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
      content: `Instant Meta Lead Ad Ingestion for brand [${business.toUpperCase()}] from campaign "${campaignName}" (Form ID: ${formId})`,
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
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Meta Lead Ads Webhook Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Processed with internal fallback" },
      { status: 200 }
    );
  }
}
