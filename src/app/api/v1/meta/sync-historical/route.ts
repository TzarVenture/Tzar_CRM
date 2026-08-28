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

    let { formId, pageAccessToken: token, business = "tzar" } = body;

    // Resolve Page Access Token from environment variables or hardcoded master fallback
    const TZAR_MASTER_TOKEN = "EAAUIZCL1Afd8BSbXS7Rdf4VCKDDmxBSEk8zAdgyeGuQH1IZCyZCXRDJHh8X3FlTMc2EdXCZANqBnK7Kkb9ZAuDE3X96HIpQbmPxZAyTYV2vLFEnA8qWpinfbUePQsSbaLkB1IyELuSdrFdNR8scAGGOqLhRz2JrD4fB1r5tEC1QQXu4SEuOf9pfdGGttUEr6inz87Bo7zMi38ApxqDZAvjt5bDYKgGc3T2gATehleYB";
    const TITEPO_MASTER_TOKEN = "EAAUIZCL1Afd8BSdhwsRR8WCJLNLzXgtZAeGQUkSiyzpRJkz3KIDZC313uFE0YtNwRZCUHmFGrvvzRFST3LDk8epbuuoAH7JJZAQ9tTRsxo4hTdR9vBW3LynZCN6RcGM6Dru4mbr9TUpZBimeV14AmjwYwV6RVwEuhBwI7ePpzYbCvIJ1ZB1HmodLyYnKo2LqhioWKZClcZA6pPWDt1KRzbvZCvhXZC7EyQsx8HCVHLZCOJPZAx";

    if (!token) {
      if (business === "tzar") token = process.env.META_PAGE_ACCESS_TOKEN_TZAR || TZAR_MASTER_TOKEN;
      if (business === "adshalaa") token = process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA;
      if (business === "crownleaf") token = process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF;
      if (business === "titepo") token = process.env.META_PAGE_ACCESS_TOKEN_TITEPO || TITEPO_MASTER_TOKEN;

      token =
        token ||
        process.env.META_PAGE_ACCESS_TOKEN_TZAR ||
        TZAR_MASTER_TOKEN;
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing Page Access Token. Please provide a Page Access Token with 'leads_retrieval' & 'pages_manage_ads' permissions." },
        { status: 400 }
      );
    }

    await dbConnect();

    // ─── AUTO-DISCOVER FORMS IF FORM_ID OMITTED ───────────────────────
    let targetFormIds: string[] = [];

    if (formId && formId.trim()) {
      targetFormIds.push(formId.trim());
    } else {
      // Auto-discover forms by resolving Page ID first, then querying /{PAGE_ID}/leadgen_forms
      try {
        const pageInfoRes = await axios.get(
          `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${token}`
        );
        const resolvedPageId = pageInfoRes.data?.id;

        if (resolvedPageId) {
          const directFormsRes = await axios.get(
            `https://graph.facebook.com/v20.0/${resolvedPageId}/leadgen_forms?access_token=${token}`
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          targetFormIds = (directFormsRes.data?.data || []).map((f: any) => f.id);
        }
      } catch (discErr: any) {
        console.warn("Form auto-discovery warning:", discErr.response?.data || discErr.message);
      }
    }

    if (targetFormIds.length === 0) {
      return NextResponse.json(
        { error: "No Lead Forms found for this Page Token. Please enter your Meta Lead Form ID manually or verify token permissions." },
        { status: 400 }
      );
    }

    let totalSyncedCount = 0;
    let totalSkippedCount = 0;
    const pipeline = await getDefaultPipeline();
    const assignedTo = await getAssignedBDE();

    // ─── FETCH & INGEST LEADS FOR ALL TARGET FORMS ─────────────────────
    for (const fId of targetFormIds) {
      try {
        const graphUrl = `https://graph.facebook.com/v20.0/${fId}/leads?fields=created_time,id,field_data,form_id&limit=100&access_token=${token}`;
        const metaRes = await axios.get(graphUrl);

        const rawLeads = metaRes.data?.data || [];

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
            totalSkippedCount++;
            continue;
          }

          // Deduplication check
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dedupeQuery: any[] = [];
          if (email && email.includes("@")) dedupeQuery.push({ email: email.toLowerCase() });
          if (phone && phone.replace(/\D/g, "").length >= 7) {
            const cleanDigits = phone.replace(/\D/g, "").slice(-10);
            dedupeQuery.push({ phone: { $regex: cleanDigits } });
          }

          if (dedupeQuery.length > 0) {
            const existing = await Lead.findOne({
              business,
              $or: dedupeQuery,
            });

            if (existing) {
              totalSkippedCount++;
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
            interestedServices: ["Historical Meta Form Sync"],
            pipelineId: pipeline._id,
            stageId: "new-lead",
            assignedTo,
            score,
            status: "ACTIVE",
            slaDeadline,
            metaAdDetails: {
              formId: fId,
            },
            syncedFrom: "META_GRAPH_API",
            createdAt: createdTime,
          });

          await Message.create({
            leadId: newLead._id,
            channel: "SYSTEM_NOTE",
            direction: "INBOUND",
            content: `Historical Meta Lead Ad synced from Form ID ${fId} (Submitted: ${createdTime.toLocaleDateString()})`,
            status: "DELIVERED",
            createdAt: createdTime,
          });

          totalSyncedCount++;
        }
      } catch (formErr: any) {
        const metaError = formErr.response?.data?.error;
        console.error(`Error syncing leads for form ${fId}:`, metaError || formErr.message);

        if (metaError?.code === 200 || metaError?.error_subcode === 33) {
          return NextResponse.json(
            {
              error: `Meta Permission Notice: Missing 'pages_manage_ads' or 'leads_retrieval' permission. Please ensure your Page Token has 'pages_manage_ads', 'leads_retrieval', and 'pages_show_list' permissions enabled in Meta Developer Portal.`,
              details: metaError,
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      status: "success",
      syncedCount: totalSyncedCount,
      skippedCount: totalSkippedCount,
      message: `Successfully imported ${totalSyncedCount} historical leads for ${business.toUpperCase()} across ${targetFormIds.length} form(s)! (${totalSkippedCount} duplicates skipped)`,
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
