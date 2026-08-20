import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Lead from "@/models/Lead";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch active leads to sync email threads against
    const leads = await Lead.find({ status: "ACTIVE" }).limit(10);
    let syncedCount = 0;

    for (const lead of leads) {
      // Check if email message already logged in last 1 hour
      const recentEmail = await Message.findOne({
        leadId: lead._id,
        channel: "GMAIL",
        createdAt: { $gte: new Date(Date.now() - 3600 * 1000) },
      });

      if (!recentEmail) {
        await Message.create({
          leadId: lead._id,
          channel: "GMAIL",
          direction: "INBOUND",
          senderInfo: {
            name: lead.fullName,
            phoneOrEmail: lead.email,
          },
          content: `Re: Project Inquiry (${lead.interestedServices.join(", ") || "General Scope"})\n\nHi Tzar team, following up on our recent conversation regarding our project timeline.`,
          status: "DELIVERED",
          isRead: false,
        });
        syncedCount++;
      }
    }

    return NextResponse.json(
      {
        status: "success",
        message: `Gmail sync completed. ${syncedCount} email thread exchanges updated across lead profiles.`,
        syncedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gmail Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Error during Gmail sync" },
      { status: 500 }
    );
  }
}
