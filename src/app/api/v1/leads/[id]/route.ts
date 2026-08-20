import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Message from "@/models/Message";
import FileAsset from "@/models/FileAsset";
import { auth } from "@/lib/auth";

const UpdateLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  estimatedBudget: z.number().optional(),
  requirementsMessage: z.string().optional(),
  assignedTo: z.string().optional(),
  stageId: z.string().optional(),
  status: z.enum(["ACTIVE", "CONVERTED", "ARCHIVED", "LOST"]).optional(),
});

// GET: 360° Lead Profile
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const lead = await Lead.findById(id).populate(
      "assignedTo",
      "name email avatarUrl role"
    );

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const messages = await Message.find({ leadId: lead._id })
      .sort({ createdAt: 1 })
      .populate("senderId", "name email avatarUrl");

    const files = await FileAsset.find({ relatedLeadId: lead._id })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email");

    return NextResponse.json({ lead, messages, files }, { status: 200 });
  } catch (error) {
    console.error("GET Lead Detail Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead details" },
      { status: 500 }
    );
  }
}

// PATCH: Edit Lead Details
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

    const parseResult = UpdateLeadSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    await dbConnect();
    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const data = parseResult.data;
    if (data.fullName) lead.fullName = data.fullName;
    if (data.email) lead.email = data.email.toLowerCase();
    if (data.phone) lead.phone = data.phone;
    if (data.companyName !== undefined) lead.companyName = data.companyName;
    if (data.city !== undefined) lead.city = data.city;
    if (data.country !== undefined) lead.country = data.country;
    if (data.estimatedBudget !== undefined) lead.estimatedBudget = data.estimatedBudget;
    if (data.requirementsMessage !== undefined) lead.requirementsMessage = data.requirementsMessage;
    if (data.assignedTo) lead.assignedTo = data.assignedTo as any;
    if (data.stageId) lead.stageId = data.stageId as any;
    if (data.status) lead.status = data.status;

    await lead.save();

    const updatedLead = await Lead.findById(id).populate(
      "assignedTo",
      "name email avatarUrl role"
    );

    return NextResponse.json({ lead: updatedLead }, { status: 200 });
  } catch (error) {
    console.error("PATCH Lead Error:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

// DELETE: Delete Lead Record (Strictly Super Admin Only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admin (Agency Owner) can delete leads" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await dbConnect();

    const deletedLead = await Lead.findByIdAndDelete(id);
    if (!deletedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Clean up related messages
    await Message.deleteMany({ leadId: id });

    return NextResponse.json(
      { status: "success", message: "Lead deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Lead Error:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
