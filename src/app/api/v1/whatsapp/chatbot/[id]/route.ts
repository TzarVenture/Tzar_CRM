import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatbotRule from "@/models/ChatbotRule";
import { auth } from "@/lib/auth";

export async function DELETE(
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

    const deletedRule = await ChatbotRule.findByIdAndDelete(id);
    if (!deletedRule) {
      return NextResponse.json({ error: "Chatbot rule not found" }, { status: 404 });
    }

    return NextResponse.json(
      { status: "success", message: "Chatbot rule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE Chatbot Rule Error:", error);
    return NextResponse.json(
      { error: "Failed to delete chatbot rule" },
      { status: 500 }
    );
  }
}
