import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import User from "@/models/User";
import { auth } from "@/lib/auth";
import { generateClientCustomId } from "@/lib/lead-utils";

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyName,
      business = "tzar",
      primaryContact,
      monthlyRetainer = 0,
      activeServices = [],
      healthScore = "HEALTHY",
    } = body;

    if (!companyName || !primaryContact?.name || !primaryContact?.email || !primaryContact?.phone) {
      return NextResponse.json(
        { error: "Company name, contact name, email, and phone are required." },
        { status: 400 }
      );
    }

    await dbConnect();

    const clientCustomId = await generateClientCustomId(business);

    const newClient = await Client.create({
      clientCustomId,
      companyName,
      primaryContact,
      monthlyRetainerBudget: Number(monthlyRetainer) || 0,
      totalRevenueToDate: Number(monthlyRetainer) || 0,
      accountManagerId: session.user.id,
      activeServices: Array.isArray(activeServices) ? activeServices : [activeServices],
      status: "ACTIVE",
      onboardingStatus: "COMPLETED",
      onboardingCompleted: true,
      portalAccessEnabled: true,
      portalAccessActive: true,
      portalPasscode: Math.floor(100000 + Math.random() * 900000).toString(),
    });

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error("POST Create Client Error:", error);
    return NextResponse.json(
      { error: "Failed to create client account", details: String(error) },
      { status: 500 }
    );
  }
}
