import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import FileAsset from "@/models/FileAsset";
import Message from "@/models/Message";
import { auth } from "@/lib/auth";

const CommitFileSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileKey: z.string().min(1, "File key is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileSize: z.number().default(0),
  mimeType: z.string().default("application/octet-stream"),
  category: z
    .enum(["CONTRACT", "PROPOSAL", "DESIGN_ASSET", "INVOICE", "OTHER"])
    .default("OTHER"),
  relatedLeadId: z.string().optional(),
  relatedClientId: z.string().optional(),
  accessLevel: z.enum(["INTERNAL_ONLY", "PUBLIC_CLIENT"]).default("INTERNAL_ONLY"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CommitFileSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    await dbConnect();

    const newFile = await FileAsset.create({
      fileName: data.fileName,
      fileKey: data.fileKey,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      category: data.category,
      accessLevel: data.accessLevel,
      uploadedBy: session.user.id,
      relatedLeadId: data.relatedLeadId || undefined,
      relatedClientId: data.relatedClientId || undefined,
    });

    // Log timeline activity if attached to lead
    if (data.relatedLeadId) {
      await Message.create({
        leadId: data.relatedLeadId,
        channel: "SYSTEM_NOTE",
        direction: "INBOUND",
        content: `Document uploaded: "${data.fileName}" (${(data.fileSize / 1024).toFixed(1)} KB, Category: ${data.category}, Access: ${data.accessLevel}) by ${session.user.name || session.user.email}`,
        status: "DELIVERED",
      });
    }

    return NextResponse.json({ file: newFile }, { status: 201 });
  } catch (error) {
    console.error("Commit File Error:", error);
    return NextResponse.json(
      { error: "Failed to record committed file asset" },
      { status: 500 }
    );
  }
}

// GET: Fetch list of file assets
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const accessLevel = searchParams.get("accessLevel");

    await dbConnect();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (category) filter.category = category;
    if (accessLevel) filter.accessLevel = accessLevel;

    const files = await FileAsset.find(filter)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name email role")
      .populate("relatedLeadId", "fullName leadCustomId")
      .populate("relatedClientId", "companyName clientCustomId");

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("GET Files Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
