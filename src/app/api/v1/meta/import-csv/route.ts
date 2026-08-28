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

    for (const rawRecord of leads) {
      // Extract normalized fields from CSV row
      const fullName =
        rawRecord["full_name"] ||
        rawRecord["fullName"] ||
        rawRecord["Full Name"] ||
        rawRecord["name"] ||
        rawRecord["Name"] ||
        "Meta Lead";

      const email = (
        rawRecord["email"] ||
        rawRecord["Email"] ||
        rawRecord["email_address"] ||
        ""
      ).toLowerCase().trim();

      const phone = (
        rawRecord["phone_number"] ||
        rawRecord["phone"] ||
        rawRecord["Phone"] ||
        rawRecord["Phone Number"] ||
        ""
      ).trim();

      const city =
        rawRecord["city"] || rawRecord["City"] || rawRecord["location"] || "";
      const companyName =
        rawRecord["company_name"] || rawRecord["company"] || rawRecord["Company"] || "";

      if (!phone && !email) {
        skippedCount++;
        continue;
      }

      // Deduplication check
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dedupeQuery: any[] = [];
      if (email && email.includes("@")) dedupeQuery.push({ email });
      if (phone && phone.replace(/\D/g, "").length >= 10) {
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

      const newLead = await Lead.create({
        leadCustomId,
        business: business as BusinessSlug,
        fullName,
        email,
        phone,
        companyName,
        city,
        source: "META_LEAD_AD",
        interestedServices: ["Meta Lead Ad CSV Import"],
        pipelineId: pipeline._id,
        stageId: "new-lead",
        assignedTo,
        score,
        status: "ACTIVE",
        slaDeadline,
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
      totalRecords: leads.length,
      message: `Successfully imported ${importedCount} Meta leads for ${business.toUpperCase()}! (${skippedCount} duplicates skipped)`,
    });
  } catch (error: any) {
    console.error("CSV Lead Import Error:", error);
    return NextResponse.json(
      { error: "Failed to import CSV leads", details: error.message },
      { status: 500 }
    );
  }
}
