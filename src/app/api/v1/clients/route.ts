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

    let clients = await Client.find()
      .sort({ createdAt: -1 })
      .populate("accountManagerId", "name email role");

    // Seed sample clients if empty
    if (clients.length === 0) {
      const bdeUser = await User.findOne({ role: "BDE" });

      const sampleClients = [
        {
          clientCustomId: "TZ-CL-2001",
          companyName: "Innovate Retail Group",
          primaryContact: {
            name: "Vikram Malhotra",
            email: "vikram@innovatecorp.com",
            phone: "+91 98765 43210",
            designation: "Managing Director",
          },
          industry: "E-Commerce & Retail",
          status: "ACTIVE",
          monthlyRetainerBudget: 15000,
          totalRevenueToDate: 45000,
          accountManagerId: bdeUser?._id,
          onboardingStatus: "COMPLETED",
          onboardingCompleted: true,
          portalAccessActive: true,
          portalPasscode: "849201",
          activeServices: ["Website Development", "SEO Retainers"],
        },
        {
          clientCustomId: "TZ-CL-2002",
          companyName: "Apex Global Financials",
          primaryContact: {
            name: "Marcus Vance",
            email: "m.vance@apexretail.io",
            phone: "+44 20 7946 0912",
            designation: "Head of Marketing",
          },
          industry: "Financial Services",
          status: "ACTIVE",
          monthlyRetainerBudget: 25000,
          totalRevenueToDate: 75000,
          accountManagerId: bdeUser?._id,
          onboardingStatus: "COMPLETED",
          onboardingCompleted: true,
          portalAccessActive: true,
          portalPasscode: "712903",
          activeServices: ["PPC & Meta Ads", "SEO Retainers"],
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clients = (await Client.insertMany(sampleClients as any)) as any;
    }

    return NextResponse.json({ clients }, { status: 200 });
  } catch (error) {
    console.error("GET Clients Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch client directory" },
      { status: 500 }
    );
  }
}
