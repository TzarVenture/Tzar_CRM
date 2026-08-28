import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug } from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";
import {
  getDefaultPipeline,
  getAssignedBDE,
  calculateLeadScore,
  generateLeadCustomId,
} from "@/lib/lead-utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { formId, pageAccessToken, business = "tzar" } = body;

    // Resolve brand specific or generic access token
    let token = pageAccessToken;

    if (!token) {
      if (business === "tzar") token = process.env.META_PAGE_ACCESS_TOKEN_TZAR;
      if (business === "adshalaa") token = process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA;
      if (business === "crownleaf") token = process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF;
      if (business === "titepo") token = process.env.META_PAGE_ACCESS_TOKEN_TITEPO;

      token =
        token ||
        process.env.META_PAGE_ACCESS_TOKEN_TZAR ||
        process.env.META_PAGE_ACCESS_TOKEN ||
        process.env.META_SYSTEM_USER_TOKEN ||
        process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
        process.env.WHATSAPP_ACCESS_TOKEN ||
        process.env.WHATSAPP_TOKEN;
    }

    if (!formId) {
      return NextResponse.json(
        { error: "Meta Lead Form ID is required." },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing Page Access Token in environment variables or payload." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Fetch past leads from Meta Graph API for this form
    const graphUrl = `https://graph.facebook.com/v20.0/${formId}/leads?fields=created_time,id,field_data,form_id&limit=100&access_token=${token}`;
    const metaRes = await axios.get(graphUrl);

    const rawLeads = metaRes.data?.data || [];
    let syncedCount = 0;
    let skippedCount = 0;

    const pipeline = await getDefaultPipeline();
    const assignedTo = await getAssignedBDE();

    for (const item of rawLeads) {
      const createdTime = item.created_time ? new Date(item.created_time) : new Date();

      let fullName = "Historical Meta Lead";
      let email = "";
      let phone = "";
      let companyName = "";
      let city = "";

      if (item.field_data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item.field_data.forEach((field: any) => {
          const name = field.name?.toLowerCase() || "";
          const val = field.values?.[0];
          if (!val) return;
          if (name.includes("full_name") || name.includes("name")) fullName = val;
          if (name.includes("email")) email = val;
          if (name.includes("phone")) phone = val;
          if (name.includes("company")) companyName = val;
          if (name.includes("city")) city = val;
        });
      }

      if (!phone && !email) {
        skippedCount++;
        continue;
      }

      // Check if lead already exists by email or phone
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dedupeQuery: any[] = [];
      if (email && email.includes("@")) dedupeQuery.push({ email: email.toLowerCase() });
      if (phone && phone.replace(/\D/g, "").length >= 10) {
        const cleanDigits = phone.replace(/\D/g, "").slice(-10);
        dedupeQuery.push({ phone: { $regex: cleanDigits } });
      }

      if (dedupeQuery.length > 0) {
        const existing = await Lead.findOne({
          business,
          $or: dedupeQuery,
        });

        if (existing) {
          skippedCount++;
          continue;
        }
      }

      const leadCustomId = await generateLeadCustomId(business as BusinessSlug);
      const score = calculateLeadScore({ phone, interestedServices: ["Historical Meta Lead"] });

      const slaDeadline = new Date(createdTime);
      slaDeadline.setHours(slaDeadline.getHours() + 24);

      const newLead = await Lead.create({
        leadCustomId,
        business: business as BusinessSlug,
        fullName,
        email: email.toLowerCase(),
        phone,
        companyName,
        city,
        source: "META_LEAD_AD",
        interestedServices: ["Historical Meta Form Import"],
        pipelineId: pipeline._id,
        stageId: "new-lead",
        assignedTo,
        score,
        status: "ACTIVE",
        slaDeadline,
        metaAdDetails: {
          adId: "historical_import",
          formId,
        },
        syncedFrom: "META_HISTORICAL_SYNC",
        createdAt: createdTime,
      });

      await Message.create({
        leadId: newLead._id,
        channel: "SYSTEM_NOTE",
        direction: "INBOUND",
        content: `Historical Meta Lead Ad synced from Form ID ${formId} (Submitted: ${createdTime.toLocaleDateString()})`,
        status: "DELIVERED",
        createdAt: createdTime,
      });

      syncedCount++;
    }

    return NextResponse.json({
      status: "success",
      syncedCount,
      skippedCount,
      totalFetched: rawLeads.length,
      message: `Successfully imported ${syncedCount} historical leads for ${business.toUpperCase()}! (${skippedCount} duplicates skipped)`,
    });
  } catch (error: any) {
    const metaError = error.response?.data?.error;
    const errorMsg = metaError?.message || error.message || "Failed to fetch historical leads from Meta Graph API.";

    console.error("Historical Meta Leads Sync Error:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error: errorMsg,
        details: metaError || error.message,
      },
      { status: 400 }
    );
  }
}
