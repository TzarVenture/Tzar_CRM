import { NextResponse } from "next/server";
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
    const { leads, business = "titepo" } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "No lead records provided in CSV payload." },
        { status: 400 }
      );
    }

    await dbConnect();

    const pipeline = await getDefaultPipeline();
    const assignedTo = await getAssignedBDE();

    let importedCount = 0;
    let skippedCount = 0;
    let emptyCount = 0;

    for (const rawRecord of leads) {
      // Find key matching case-insensitively & cleaning null bytes
      const getKey = (...possibleKeys: string[]): string => {
        for (const pKey of possibleKeys) {
          const lowerP = pKey.toLowerCase().replace(/[^a-z0-9]/g, "");
          for (const actualKey of Object.keys(rawRecord)) {
            const cleanActual = actualKey.replace(/\0/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (cleanActual === lowerP) {
              const val = rawRecord[actualKey];
              if (val !== undefined && val !== null) {
                const strVal = String(val).replace(/\0/g, "").trim();
                if (strVal) return strVal;
              }
            }
          }
        }
        return "";
      };

      let fullName =
        getKey("full_name", "fullname", "full name", "name", "first_name") || "Meta Lead";
      fullName = fullName.replace(/^"|"$/g, "").trim();

      let email = getKey("email", "email_address", "mail").toLowerCase();
      email = email.replace(/^"|"$/g, "").trim();

      let phone = getKey("phone_number", "phone", "mobile", "contact_number", "number", "phonenumber");
      phone = phone.replace(/^p:/i, "").replace(/^"|"$/g, "").trim();

      const city = getKey("city", "location", "state", "address").replace(/^"|"$/g, "").trim();
      const companyName = getKey("company_name", "company", "organization").replace(/^"|"$/g, "").trim();

      // Extract Titepo Custom Form Fields
      const eventType = getKey("what_is_the_occasion?", "occasion", "event_type", "event");
      const kidsCount = getKey("how_many_return_gifts_do_you_need?", "return_gifts", "quantity", "kids_count");
      const budgetPerGift = getKey("what_is_your_budget_per_return_gift?", "budget", "budget_per_gift");
      const childAgeGroup = getKey("child's_age_group?", "child_age", "age_group", "age");
      const eventDate = getKey("date", "event_date");
      const specialRequirements = getKey("any_special_requirements?_(eg._need_personalized_names,_gift_wrapping,_urgent_delivery,_specific_colors,_etc.)", "special_requirements", "requirements");
      const platform = getKey("platform");

      // Extract Meta Campaign Attribution Details
      const adId = getKey("ad_id");
      const adName = getKey("ad_name");
      const campaignId = getKey("campaign_id");
      const campaignName = getKey("campaign_name");
      const formId = getKey("form_id");
      const formName = getKey("form_name");

      // If record is missing both email & phone, skip
      if (!phone && !email) {
        emptyCount++;
        continue;
      }

      // Deduplication check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dedupeQuery: any[] = [];
      if (email && email.includes("@")) dedupeQuery.push({ email });
      if (phone && phone.replace(/\D/g, "").length >= 7) {
        const cleanDigits = phone.replace(/\D/g, "").slice(-10);
        dedupeQuery.push({ phone: { $regex: cleanDigits } });
      }

      if (dedupeQuery.length > 0) {
        const existing = await Lead.findOne({
          business: business as BusinessSlug,
          $or: dedupeQuery,
        });

        if (existing) {
          skippedCount++;
          continue;
        }
      }

      const leadCustomId = await generateLeadCustomId(business as BusinessSlug);
      const score = calculateLeadScore({ phone, interestedServices: ["Facebook Lead Ad"] });

      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + 24);

      const titepoData = business === "titepo" ? {
        eventType,
        kidsCount,
        budgetPerGift,
        childAgeGroup,
        eventDate,
        specialRequirements,
        platform,
      } : undefined;

      const newLead = await Lead.create({
        leadCustomId,
        business: business as BusinessSlug,
        fullName,
        email,
        phone,
        companyName,
        city,
        source: "META_LEAD_AD",
        interestedServices: [eventType ? `Titepo ${eventType}` : "Meta Lead Ad CSV Import"],
        requirementsMessage: specialRequirements || undefined,
        pipelineId: pipeline._id,
        stageId: "new-lead",
        assignedTo,
        score,
        status: "ACTIVE",
        slaDeadline,
        titepoData,
        metaAdDetails: {
          adId,
          adName,
          campaignId,
          campaignName,
          formId,
        },
        syncedFrom: "META_CSV_IMPORT",
      });

      await Message.create({
        leadId: newLead._id,
        channel: "SYSTEM_NOTE",
        direction: "INBOUND",
        content: `Lead imported from Facebook Meta Lead Ads CSV Export (${business.toUpperCase()}).`,
        status: "DELIVERED",
      });

      importedCount++;
    }

    return NextResponse.json({
      status: "success",
      importedCount,
      skippedCount,
      emptyCount,
      totalRecords: leads.length,
      message: `Successfully imported ${importedCount} Meta leads for ${business.toUpperCase()}! (${skippedCount} duplicates skipped, ${emptyCount} empty skipped)`,
    });
  } catch (error: any) {
    console.error("CSV Lead Import Error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV leads", details: error.message },
      { status: 500 }
    );
  }
}
