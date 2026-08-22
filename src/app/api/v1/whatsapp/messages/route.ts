import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

/**
 * DELETE: Delete a single message or clear an entire lead chat thread
 */
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const leadId = searchParams.get("leadId");

    await dbConnect();

    // 1. Delete single message
    if (messageId) {
      const deletedMessage = await Message.findByIdAndDelete(messageId);
      if (!deletedMessage) {
        return NextResponse.json({ error: "Message not found" }, { status: 404 });
      }

      return NextResponse.json(
        { success: true, message: "Message deleted successfully" },
        { status: 200 }
      );
    }

    // 2. Clear entire conversation thread for leadId
    if (leadId) {
      const result = await Message.deleteMany({ leadId });
      return NextResponse.json(
        {
          success: true,
          deletedCount: result.deletedCount,
          message: "Entire conversation history cleared successfully",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Provide either messageId or leadId to delete" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("DELETE Message Error:", error);
    return NextResponse.json(
      { error: "Failed to delete message(s)" },
      { status: 500 }
    );
  }
}
