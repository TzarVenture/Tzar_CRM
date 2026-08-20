import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    await dbConnect();

    const client = await Client.findById(clientId).select(
      "companyName clientCustomId primaryContact portalPasscode onboardingCompleted portalAccessActive"
    );

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    console.error("GET Portal Client Error:", error);
    return NextResponse.json({ error: "Failed to fetch portal client data" }, { status: 500 });
  }
}
