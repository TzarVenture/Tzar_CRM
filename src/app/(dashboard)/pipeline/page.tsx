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

  // Serialize MongoDB BSON documents for React Client Component
  const leads = rawLeads.map((l: any) => ({
    ...l,
    _id: l._id.toString(),
    pipelineId: l.pipelineId ? l.pipelineId.toString() : undefined,
    assignedTo: l.assignedTo ? l.assignedTo.toString() : undefined,
    clientId: l.clientId ? l.clientId.toString() : undefined,
    convertedClientId: l.convertedClientId ? l.convertedClientId.toString() : undefined,
    createdAt: l.createdAt ? l.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: l.updatedAt ? l.updatedAt.toISOString() : new Date().toISOString(),
    slaDeadline: l.slaDeadline ? l.slaDeadline.toISOString() : undefined,
  }));

  return (
    <div className="animate-fade-in space-y-6">
      <SmartLeadGrid initialLeads={leads as any} />
    </div>
  );
}

