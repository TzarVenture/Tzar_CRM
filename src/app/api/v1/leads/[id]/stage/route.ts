import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

const UpdateStageSchema = z.object({
  stageId: z.enum([
    "new-lead",
    "contacted",
    "discovery-call",
    "proposal-sent",
    "negotiation",
    "closed-won",
    "closed-lost",
  ]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const parseResult = UpdateStageSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid stageId", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { stageId } = parseResult.data;
    await dbConnect();

    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const oldStage = lead.stageId;
    if (oldStage === stageId) {
      return NextResponse.json({ lead }, { status: 200 });
    }

    lead.stageId = stageId;
    await lead.save();

    // System note for timeline audit
    await Message.create({
      leadId: lead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      content: `Lead stage changed from "${oldStage}" to "${stageId}" by ${session.user.name || session.user.email}`,
      status: "DELIVERED",
    });

    const updatedLead = await Lead.findById(id).populate(
      "assignedTo",
      "name email avatarUrl role"
    );

    return NextResponse.json({ lead: updatedLead }, { status: 200 });
  } catch (error) {
    console.error("PATCH Lead Stage Error:", error);
    return NextResponse.json(
      { error: "Failed to update lead stage" },
      { status: 500 }
    );
  }
}
