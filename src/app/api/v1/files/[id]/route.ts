import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FileAsset from "@/models/FileAsset";
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

    const deletedFile = await FileAsset.findByIdAndDelete(id);
    if (!deletedFile) {
      return NextResponse.json({ error: "File asset not found" }, { status: 404 });
    }

    return NextResponse.json(
      { status: "success", message: "File asset deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE File Error:", error);
    return NextResponse.json(
      { error: "Failed to delete file asset" },
      { status: 500 }
    );
  }
}
