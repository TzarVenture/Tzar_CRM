import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Lead from "@/models/Lead";
import { auth } from "@/lib/auth";

const NoteSchema = z.object({
  content: z.string().min(1, "Note content cannot be empty"),
});

export async function POST(
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

    const parseResult = NoteSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid note content" },
        { status: 400 }
      );
    }

    await dbConnect();
    const lead = await Lead.findById(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const note = await Message.create({
      leadId: lead._id,
      channel: "SYSTEM_NOTE",
      direction: "INBOUND",
      senderId: session.user.id,
      senderInfo: {
        name: session.user.name || "User",
        phoneOrEmail: session.user.email || undefined,
      },
      content: parseResult.data.content,
      status: "DELIVERED",
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST Lead Note Error:", error);
    return NextResponse.json(
      { error: "Failed to add internal note" },
      { status: 500 }
    );
  }
}
