import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { SmartLeadGrid } from "@/components/leads/SmartLeadGrid";

export const metadata: Metadata = {
  title: "Multi-Brand Sales Pipeline Grid",
};

export const revalidate = 0; // Fresh real-time data

export default async function PipelinePage() {
  await dbConnect();
  const rawLeads = await Lead.find({ status: "ACTIVE" }).sort({ createdAt: -1 }).lean();

  // Serialize MongoDB BSON documents for React Client Component (strips nested ObjectId buffers)
  const serializedLeads = JSON.parse(JSON.stringify(rawLeads));

  return (
    <div className="animate-fade-in space-y-6">
      <SmartLeadGrid initialLeads={serializedLeads} />
    </div>
  );
}

