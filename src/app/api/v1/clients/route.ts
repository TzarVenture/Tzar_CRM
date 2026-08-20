import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import User from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const clients = await Client.find()
      .sort({ createdAt: -1 })
      .populate("accountManagerId", "name email role");

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error("GET Clients Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client directory" },
      { status: 500 }
    );
  }
}
