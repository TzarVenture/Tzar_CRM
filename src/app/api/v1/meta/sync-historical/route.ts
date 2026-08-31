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

    // Resolve Page Access Token from environment variables or active token fallback
    const NEW_TZAR_TOKEN = process.env.META_USER_ACCESS_TOKEN || "EAAUIZCL1Afd8BSY4JszH1IEbP1Dp7V0UKPACyYdrZApz94VY88xo77Ld1qeGQZB1ZC7W2kNX6OGYRFPRdwVPHHWMCnsHOhqSX4S1EqyVX1LZBulrK3x6zOcFRltbLAkO5KZBI3364VvDoRJuBbz8kQ1VQRCrtsRAUhNocsZCELXTht8mZAXH6OG0bRd65U7HelZAezZBKdg4cfrbLOGvBHwQKhqrb4M1W1fZApjY9ZCok1VNOIoN4T7szjT2HKZCar7ZAvoJsOrplVV5RQy68ZD";
    const TITEPO_MASTER_TOKEN = "EAAUIZCL1Afd8BSdhwsRR8WCJLNLzXgtZAeGQUkSiyzpRJkz3KIDZC313uFE0YtNwRZCUHmFGrvvzRFST3LDk8epbuuoAH7JJZAQ9tTRsxo4hTdR9vBW3LynZCN6RcGM6Dru4mbr9TUpZBimeV14AmjwYwV6RVwEuhBwI7ePpzYbCvIJ1ZB1HmodLyYnKo2LqhioWKZClcZA6pPWDt1KRzbvZCvhXZC7EyQsx8HCVHLZCOJPZAx";

    if (!token) {
      if (business === "titepo") {
        token = TITEPO_MASTER_TOKEN;
      } else if (business === "tzar") {
        token = NEW_TZAR_TOKEN;
      } else if (business === "adshalaa") {
        token = process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA || NEW_TZAR_TOKEN;
      } else if (business === "crownleaf") {
        token = process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF || NEW_TZAR_TOKEN;
      } else {
        token = NEW_TZAR_TOKEN;
      }
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

    if (formId && formId.trim()) {
      targetFormIds.push(formId.trim());
    } else {
      try {
        // Query me/accounts to get page-specific access token or page ID
        const accRes = await axios.get(
          `https://graph.facebook.com/v20.0/me/accounts?access_token=${token}`
        );
        const pages = accRes.data?.data || [];
        const targetPageId = BRAND_PAGE_IDS[business] || "364879847573029";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageMatch = pages.find((p: any) => String(p.id) === targetPageId);
        const usePageToken = pageMatch?.access_token || token;

        const directFormsRes = await axios.get(
          `https://graph.facebook.com/v20.0/${targetPageId}/leadgen_forms?access_token=${usePageToken}`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetFormIds = (directFormsRes.data?.data || []).map((f: any) => f.id);
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

          let fullName = "Meta Lead";
          let email = "";
          let phone = "";
          let companyName = "";
          let city = "";
          let eventType = "";
          let kidsCount = "";
          let budgetPerGift = "";
          let childAgeGroup = "";
          let eventDate = "";
          let specialRequirements = "";
          const metaFormFields: { label: string; value: string }[] = [];

          if (item.field_data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item.field_data.forEach((field: any) => {
              const rawName = field.name || "";
              const name = rawName.toLowerCase();
              const val = field.values?.[0] || "";
              if (!val) return;

              metaFormFields.push({
                label: rawName.replace(/_/g, " "),
                value: val,
              });

              if (name.includes("full_name") || name.includes("name")) fullName = val;
              if (name.includes("email")) email = val;
              if (name.includes("phone")) phone = val;
              if (name.includes("company")) companyName = val;
              if (name.includes("city")) city = val;
              if (name.includes("occasion") || name.includes("event")) eventType = val;
              if (name.includes("return_gifts") || name.includes("quantity")) kidsCount = val;
              if (name.includes("budget")) budgetPerGift = val;
              if (name.includes("age")) childAgeGroup = val;
              if (name.includes("date")) eventDate = val;
              if (name.includes("requirements") || name.includes("special")) specialRequirements = val;
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

          // Dynamic Interest / Program Label Construction
          let interestLabel = "Meta Lead Ad Form";
          if (business === "titepo") {
            interestLabel = eventType ? `${eventType.replace(/_/g, " ")} (${kidsCount || "Return Gifts"})` : "Titepo Return Gifts";
          } else if (business === "tzar") {
            interestLabel = companyName ? `${companyName} - WebDev` : "WebDev & Digital Marketing";
          } else if (business === "adshalaa") {
            interestLabel = "Adshalaa EdTech Program";
          } else if (business === "crownleaf") {
            interestLabel = "CrownLeaf Corporate Gifting";
          }

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
            titepoData: business === "titepo" ? {
              eventType,
              kidsCount,
              budgetPerGift,
              childAgeGroup,
              eventDate,
              specialRequirements,
              platform: "ig",
            } : undefined,
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
