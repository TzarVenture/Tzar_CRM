import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import Lead from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

const ConvertLeadSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional().default("Technology"),
  monthlyRetainerBudget: z.number().optional().default(5000),
  accountManagerId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = ConvertLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { leadId, companyName, industry, monthlyRetainerBudget, accountManagerId } =
      parseResult.data;

    await dbConnect();

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead record not found" }, { status: 404 });
    }

    // Check if client already converted
    const existingClient = await Client.findOne({ convertedFromLeadId: lead._id });
    if (existingClient) {
      return NextResponse.json(
        {
          status: "exists",
          client: existingClient,
          portalUrl: `/portal/${existingClient._id}`,
        },
        { status: 200 }
      );
    }

    // Generate Custom Client ID
    const clientCount = await Client.countDocuments();
    const clientCustomId = `TZ-CL-${2000 + clientCount + 1}`;

    // Generate 6-digit Portal Access Passcode
    const portalPasscode = String(Math.floor(100000 + Math.random() * 900000));

    // Create Client account
    const newClient = await Client.create({
      clientCustomId,
      companyName,
      primaryContact: {
        name: lead.fullName,
        email: lead.email,
        phone: lead.phone,
      },
      industry,
      status: "ACTIVE",
      monthlyRetainerBudget,
      totalRevenueToDate: monthlyRetainerBudget,
      accountManagerId: accountManagerId || lead.assignedTo || session.user.id,
      convertedFromLeadId: lead._id,
      portalAccessActive: true,
      portalPasscode,
      onboardingCompleted: false,
    });

    // Update Lead stage & status
    lead.stageId = "closed-won";
    lead.status = "CONVERTED";
    lead.convertedClientId = newClient._id as any;
    await lead.save();

    // Log timeline system note
    await Message.create({
      leadId: lead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      content: `Lead officially converted to Client Account "${companyName}" (${clientCustomId}). Onboarding portal active with Passcode: ${portalPasscode}`,
      status: "DELIVERED",
    });

    return NextResponse.json(
      {
        status: "converted",
        message: "Lead successfully converted to Client Account",
        client: newClient,
        portalUrl: `/portal/${newClient._id}`,
        portalPasscode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lead to Client Conversion Error:", error);
    return NextResponse.json(
      { error: "Failed to convert lead to client" },
      { status: 500 }
    );
  }
}
