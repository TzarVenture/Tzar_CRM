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
import { parseMetaLeadPayload } from "@/lib/lead-field-normalizer";

export interface BrandSyncResult {
  pageId: string;
  pageName?: string;
  tokenValid: boolean;
  formsCount: number;
  synced: number;
  skipped: number;
  error?: string;
  webhookSubscribed?: boolean;
}

export interface MetaSyncSummary {
  success: boolean;
  totalSynced: number;
  totalSkipped: number;
  brands: Record<string, BrandSyncResult>;
  durationMs: number;
  executedAt: string;
}

interface PageConfig {
  slug: BusinessSlug;
  name: string;
  pageId: string;
  token: string | undefined;
}

/**
 * Returns configuration for all 4 brand pages
 */
function getBrandPageConfigs(): PageConfig[] {
  return [
    {
      slug: "tzar",
      name: "Tzar Venture (Digital Marketing & WebDev)",
      pageId: process.env.META_PAGE_ID_TZAR || "364879847573029",
      token:
        process.env.META_PAGE_ACCESS_TOKEN_TZAR ||
        process.env.META_PAGE_ACCESS_TOKEN ||
        process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "titepo",
      name: "Titepo TOY STORE",
      pageId: process.env.META_PAGE_ID_TITEPO || "1019277841258458",
      token:
        process.env.META_PAGE_ACCESS_TOKEN_TITEPO ||
        process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "adshalaa",
      name: "Adshalaa EdTech Institute",
      pageId: process.env.META_PAGE_ID_ADSHALAA || "1245930131928783",
      token:
        process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA ||
        process.env.META_USER_ACCESS_TOKEN,
    },
    {
      slug: "crownleaf",
      name: "CrownLeaf Luxury Gifting",
      pageId: process.env.META_PAGE_ID_CROWNLEAF || "837451012790051",
      token:
        process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF ||
        process.env.META_USER_ACCESS_TOKEN,
    },
  ];
}

/**
 * Ensures the Facebook Page is subscribed to app webhooks for real-time delivery
 */
async function ensureWebhookSubscription(pageId: string, token: string): Promise<boolean> {
  try {
    const res = await axios.post(
      `https://graph.facebook.com/v20.0/${pageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: "leadgen",
          access_token: token,
        },
        timeout: 5000,
      }
    );
    return !!res.data?.success;
  } catch (err: any) {
    console.warn(`[Meta Webhook Sub Notice] ${pageId}:`, err.response?.data?.error?.message || err.message);
    return false;
  }
}

/**
 * Main Industry-Grade Meta Reconciliation Sync Engine
 * Mirroring Zoho / HubSpot / Salesforce active pull architecture.
 */
export async function runMetaAutoSync(
  targetBrand?: BusinessSlug,
  includeArchived = false
): Promise<MetaSyncSummary> {
  const startTime = Date.now();
  await dbConnect();

  const configs = getBrandPageConfigs().filter((c) => !targetBrand || c.slug === targetBrand);
  const summary: MetaSyncSummary = {
    success: true,
    totalSynced: 0,
    totalSkipped: 0,
    brands: {},
    durationMs: 0,
    executedAt: new Date().toISOString(),
  };

  const pipeline = await getDefaultPipeline();
  const assignedTo = await getAssignedBDE();

  for (const config of configs) {
    const brandResult: BrandSyncResult = {
      pageId: config.pageId,
      tokenValid: false,
      formsCount: 0,
      synced: 0,
      skipped: 0,
    };

    if (!config.token) {
      brandResult.error = "No Page Access Token configured in environment.";
      summary.brands[config.slug] = brandResult;
      continue;
    }

    try {
      // 1. Verify token & get page details
      const meRes = await axios.get(
        `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${config.token}`,
        { timeout: 8000 }
      );
      brandResult.tokenValid = true;
      brandResult.pageName = meRes.data?.name || config.name;

      // 2. Ensure real-time webhook subscription is actively armed
      brandResult.webhookSubscribed = await ensureWebhookSubscription(config.pageId, config.token);

      // 3. Query all active lead forms for this brand
      const formsRes = await axios.get(
        `https://graph.facebook.com/v20.0/${config.pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${config.token}`,
        { timeout: 10000 }
      );

      const allForms = formsRes.data?.data || [];
      // Prioritize ACTIVE forms for fast ~2-second polling; scan ARCHIVED only when requested
      const activeForms = allForms.filter((f: any) =>
        f.status === "ACTIVE" || (includeArchived && f.status === "ARCHIVED")
      );
      brandResult.formsCount = activeForms.length;

      // 4. Fetch leads from every form
      for (const form of activeForms) {
        try {
          let nextUrl: string | null =
            `https://graph.facebook.com/v20.0/${form.id}/leads?limit=100&fields=created_time,id,field_data,form_id&access_token=${config.token}`;

          while (nextUrl) {
            const leadsRes: any = await axios.get(nextUrl, { timeout: 15000 });
            const leadsData = leadsRes.data?.data || [];
            if (!leadsData || leadsData.length === 0) {
              break;
            }

            for (const item of leadsData) {
              const leadgenId = String(item.id);
              const createdTime = item.created_time ? new Date(item.created_time) : new Date();

              // Step A: Fast $O(1)$ check by Meta Leadgen ID
              const existingById = await Lead.findOne({ "metaAdDetails.leadgenId": leadgenId });
              if (existingById) {
                brandResult.skipped++;
                summary.totalSkipped++;
                continue;
              }

              // Step B: Normalize field data using multi-brand parser
              const normalized = parseMetaLeadPayload(item.field_data || [], config.slug);
              const fullName = normalized.fullName;
              const email = normalized.email ? normalized.email.toLowerCase() : "";
              const phone = normalized.phone || "";
              const companyName = normalized.companyName || "";
              const city = normalized.city || "";
              const metaFormFields = normalized.metaFormFields;
              const interestLabel = normalized.interestLabel || `${form.name || "Meta Lead Ad"} Inquiry`;

              // Require at least a phone or email
              if (!phone && !email) {
                brandResult.skipped++;
                summary.totalSkipped++;
                continue;
              }

              // Step C: Deduplication check by email or phone
              const dedupeQuery: any[] = [];
              if (email && email.includes("@")) {
                dedupeQuery.push({ email: email.toLowerCase() });
              }
              if (phone && phone.replace(/\D/g, "").length >= 7) {
                const cleanDigits = phone.replace(/\D/g, "").slice(-10);
                dedupeQuery.push({ phone: { $regex: cleanDigits } });
              }

              if (dedupeQuery.length > 0) {
                const existingByContact = await Lead.findOne({
                  business: config.slug,
                  $or: dedupeQuery,
                });

                if (existingByContact) {
                  // Attach the leadgenId to the existing lead if missing
                  if (!existingByContact.metaAdDetails?.leadgenId) {
                    existingByContact.metaAdDetails = {
                      ...(existingByContact.metaAdDetails || {}),
                      leadgenId,
                    };
                    await existingByContact.save();
                  }
                  brandResult.skipped++;
                  summary.totalSkipped++;
                  continue;
                }
              }

              // Step D: Create fresh multi-brand Lead
              const leadCustomId = await generateLeadCustomId(config.slug);
              const score = calculateLeadScore({ phone, interestedServices: [interestLabel] });
              const slaDeadline = new Date(createdTime);
              slaDeadline.setHours(slaDeadline.getHours() + 24);

              const newLead = await Lead.create({
                leadCustomId,
                business: config.slug,
                fullName,
                email,
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
                  leadgenId,
                  formId: String(form.id),
                  formName: form.name || "Meta Lead Form",
                  pageId: config.pageId,
                },
                metaFormFields,
                syncedFrom: "META_AUTO_SYNC",
                createdAt: createdTime,
              });

              // Log timeline note
              await Message.create({
                leadId: newLead._id,
                channel: "SYSTEM_NOTE",
                direction: "INBOUND",
                content: `Automated Meta Lead Sync [${config.slug.toUpperCase()}]: Ingested from form "${form.name}" (Meta Lead ID: ${leadgenId}). Original ad submission: ${createdTime.toLocaleString()}`,
                status: "DELIVERED",
                createdAt: createdTime,
              });

              brandResult.synced++;
              summary.totalSynced++;
            }

            // Paging continuation: if fewer than limit (100) returned, no further page exists
            if (leadsData.length < 100) {
              nextUrl = null;
            } else {
              nextUrl = leadsRes.data?.paging?.next || null;
            }
          }
        } catch (formErr: any) {
          console.error(`[Meta Sync Form Error] ${config.slug} Form ${form.id}:`, formErr.response?.data?.error?.message || formErr.message);
        }
      }
    } catch (pageErr: any) {
      const msg = pageErr.response?.data?.error?.message || pageErr.message;
      brandResult.error = msg;
      console.warn(`[Meta Sync Brand Warning] ${config.slug}: ${msg}`);
    }

    summary.brands[config.slug] = brandResult;
  }

  summary.durationMs = Date.now() - startTime;
  console.log(
    `✅ [Meta Auto-Sync Complete] Synced: ${summary.totalSynced} new leads, Skipped: ${summary.totalSkipped} in ${summary.durationMs}ms`
  );

  return summary;
}
