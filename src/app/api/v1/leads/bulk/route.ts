import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can delete leads." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { leadIds } = body;

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "No lead IDs provided for bulk deletion." },
        { status: 400 }
      );
    }

    await dbConnect();

    // Delete lead documents
    const leadDeleteResult = await Lead.deleteMany({
      _id: { $in: leadIds },
    });

    // Delete associated messages / notes
    await Message.deleteMany({
      leadId: { $in: leadIds },
    });

    return NextResponse.json({
      status: "success",
      deletedCount: leadDeleteResult.deletedCount,
      message: `Successfully deleted ${leadDeleteResult.deletedCount} leads.`,
    });
  } catch (error: any) {
    console.error("Bulk Delete Leads Error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk lead deletion", details: error.message },
      { status: 500 }
    );
  }
}
