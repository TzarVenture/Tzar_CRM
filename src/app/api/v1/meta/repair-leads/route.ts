import { NextResponse } from "next/server";
import axios from "axios";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug } from "@/models/Lead";
import { auth } from "@/lib/auth";
import { parseMetaLeadPayload } from "@/lib/lead-field-normalizer";

/**
 * POST /api/v1/meta/repair-leads
 * Maintenance endpoint that:
 * 1. Re-parses all existing leads with `metaFormFields` to fix names (e.g. "Personalised names" -> "Shrea")
 *    and populates `titepoData`, `tzarData`, `adshalaaData`, and `crownleafData`.
 * 2. Fetches missing Meta Graph API data for leads that only have metaLeadId.
 * 3. Cleans up raw underscores and sets honest interest labels.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "SUPER_ADMIN" && session.user?.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 401 });
    }

    await dbConnect();

    const leads = await Lead.find({ source: "META_LEAD_AD" });
    let repairedCount = 0;
    let fetchedFromGraphCount = 0;

    const TOKENS: Record<string, string> = {
      titepo: process.env.META_PAGE_ACCESS_TOKEN_TITEPO || process.env.META_USER_ACCESS_TOKEN || "",
      adshalaa: process.env.META_PAGE_ACCESS_TOKEN_ADSHALAA || process.env.META_USER_ACCESS_TOKEN || "",
      crownleaf: process.env.META_PAGE_ACCESS_TOKEN_CROWNLEAF || process.env.META_USER_ACCESS_TOKEN || "",
      tzar: process.env.META_PAGE_ACCESS_TOKEN_TZAR || process.env.META_USER_ACCESS_TOKEN || "",
    };

    for (const lead of leads) {
      let fields = (lead.metaFormFields || []).map((f) => ({ name: f.label, values: [f.value] }));
      let needsSave = false;

      // 1. If lead is missing metaFormFields but has metaLeadId, fetch from Meta Graph API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metaLeadId = (lead as any).metaLeadId;
      if (fields.length === 0 && metaLeadId) {
        const token = TOKENS[lead.business] || TOKENS.titepo;
        if (token && token.startsWith("EAA")) {
          try {
            const metaRes = await axios.get(
              `https://graph.facebook.com/v20.0/${metaLeadId}?access_token=${token}`
            );
            if (metaRes.data?.field_data) {
              fields = metaRes.data.field_data;
              fetchedFromGraphCount++;
            }
          } catch (err: any) {
            console.warn(`Could not fetch lead ${metaLeadId} from Graph API:`, err.message);
          }
        }
      }

      if (fields.length > 0) {
        const normalized = parseMetaLeadPayload(fields, lead.business as BusinessSlug);

        // Fix name if it was previously overwritten by special requirements
        if (normalized.fullName && normalized.fullName !== "Meta Lead" && lead.fullName !== normalized.fullName) {
          lead.fullName = normalized.fullName;
          needsSave = true;
        }

        // Update brand specific specs
        if (normalized.titepoData && Object.keys(normalized.titepoData).length > 0) {
          lead.titepoData = normalized.titepoData;
          needsSave = true;
        }
        if (normalized.tzarData && Object.keys(normalized.tzarData).length > 0) {
          lead.tzarData = normalized.tzarData;
          needsSave = true;
        }
        if (normalized.adshalaaData && Object.keys(normalized.adshalaaData).length > 0) {
          lead.adshalaaData = normalized.adshalaaData;
          needsSave = true;
        }
        if (normalized.crownleafData && Object.keys(normalized.crownleafData).length > 0) {
          lead.crownleafData = normalized.crownleafData;
          needsSave = true;
        }

        // Update metaFormFields
        if (normalized.metaFormFields.length > 0) {
          lead.metaFormFields = normalized.metaFormFields;
          needsSave = true;
        }

        // Update interestedServices if currently empty or generic
        if (
          normalized.interestLabel &&
          (!lead.interestedServices ||
            lead.interestedServices.length === 0 ||
            lead.interestedServices.includes("Meta Lead Ad Form") ||
            lead.interestedServices.includes("General Inquiry"))
        ) {
          lead.interestedServices = [normalized.interestLabel];
          needsSave = true;
        }

        // City & Street Address
        if (normalized.city && !lead.city) {
          lead.city = normalized.city;
          needsSave = true;
        }

        if (needsSave) {
          await lead.save();
          repairedCount++;
        }
      }
    }

    return NextResponse.json({
      status: "success",
      totalLeadsChecked: leads.length,
      repairedCount,
      fetchedFromGraphCount,
      message: `Lead Data Repair Complete! Successfully repaired ${repairedCount} leads (${fetchedFromGraphCount} fetched from Meta Graph API).`,
    });
  } catch (error: any) {
    console.error("Lead Repair Error:", error);
    return NextResponse.json({ error: "Failed to repair leads", details: error.message }, { status: 500 });
  }
}
