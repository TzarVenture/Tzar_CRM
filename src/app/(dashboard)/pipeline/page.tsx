import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { SmartLeadGrid } from "@/components/leads/SmartLeadGrid";

import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Multi-Brand Sales Pipeline Grid",
};

export const revalidate = 0; // Fresh real-time data

export default async function PipelinePage() {
  const session = await auth();
  await dbConnect();

  const userRole = session?.user?.role;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedBusinesses: string[] = (session?.user as any)?.allowedBusinesses || ["tzar", "titepo", "adshalaa", "crownleaf"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { status: "ACTIVE" };
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    query.business = { $in: allowedBusinesses };
  }

  const rawLeads = await Lead.find(query).sort({ createdAt: -1 }).lean();

  // Serialize MongoDB BSON documents for React Client Component (strips nested ObjectId buffers)
  const serializedLeads = JSON.parse(JSON.stringify(rawLeads));

  return (
    <div className="animate-fade-in space-y-6">
      <SmartLeadGrid initialLeads={serializedLeads} />
    </div>
  );
}

