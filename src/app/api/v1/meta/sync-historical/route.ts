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
import { parseMetaLeadPayload } from "@/lib/lead-field-normalizer";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    let { formId, pageAccessToken: token, business = "tzar" } = body;

    if (!token) {
      if (business === "titepo") token = process.env.META_PAGE_ACCESS_TOKEN_TITEPO || process.env.META_USER_ACCESS_TOKEN;
      else if (business === "adshalaa") token = process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA || process.env.META_USER_ACCESS_TOKEN;
      else if (business === "crownleaf") token = process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF || process.env.META_USER_ACCESS_TOKEN;
      else token = process.env.META_PAGE_ACCESS_TOKEN_TZAR || process.env.META_USER_ACCESS_TOKEN;
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

    const BRAND_PAGE_IDS: Record<string, string> = {
      tzar: "364879847573029",
      titepo: "1019277841258458",
      crownleaf: "837451012790051",
      adshalaa: "1245930131928783",
    };

    const targetPageId = BRAND_PAGE_IDS[business] || "364879847573029";

    if (formId && formId.trim()) {
      targetFormIds.push(formId.trim());
    } else {
      // 1. Try querying Page ID leadgen_forms directly with Page Token
      try {
        const directFormsRes = await axios.get(
          `https://graph.facebook.com/v20.0/${targetPageId}/leadgen_forms?access_token=${token}`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetFormIds = (directFormsRes.data?.data || []).map((f: any) => f.id);
      } catch (err1: any) {
        // 2. Fallback: try resolving page token via me/accounts if user token was passed
        try {
          const accRes = await axios.get(
            `https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`
          );
          const pages = accRes.data?.data || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pageMatch = pages.find((p: any) => String(p.id) === targetPageId);
          if (pageMatch?.access_token) {
            token = pageMatch.access_token;
            const fallbackFormsRes = await axios.get(
              `https://graph.facebook.com/v20.0/${targetPageId}/leadgen_forms?access_token=${token}`
            );
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            targetFormIds = (fallbackFormsRes.data?.data || []).map((f: any) => f.id);
          }
        } catch (discErr: any) {
          console.warn("Form auto-discovery notice:", discErr.response?.data || discErr.message);
        }
      }
    }

    if (targetFormIds.length === 0) {
      return NextResponse.json(
        {
          syncedCount: 0,
          message: `Sync complete for ${business.toUpperCase()}! Pipeline is 100% up to date.`,
        },
        { status: 200 }
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

          // 1. Unified, bulletproof multi-brand parsing
          const normalized = parseMetaLeadPayload(item.field_data || [], business as BusinessSlug);

          const fullName = normalized.fullName;
          const email = normalized.email;
          const phone = normalized.phone;
          const companyName = normalized.companyName || "";
          const city = normalized.city || "";
          const metaFormFields = normalized.metaFormFields;
          const interestLabel = normalized.interestLabel;

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
          const score = calculateLeadScore({ phone, interestedServices: [interestLabel] });

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
            interestedServices: [interestLabel],
            pipelineId: pipeline._id,
            stageId: "new-lead",
            assignedTo,
            score,
            status: "ACTIVE",
            slaDeadline,
            titepoData: normalized.titepoData,
            tzarData: normalized.tzarData,
            adshalaaData: normalized.adshalaaData,
            crownleafData: normalized.crownleafData,
            metaAdDetails: {
              formId: fId,
            },
            metaFormFields,
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
