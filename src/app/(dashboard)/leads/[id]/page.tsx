import type { Metadata } from "next";
import { denyUnlessAllowed } from "@/lib/page-access";
import LeadDetailClient from "@/components/leads/LeadDetailClient";

export const metadata: Metadata = {
  title: "Lead Profile",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const denied = await denyUnlessAllowed("leads.pipeline");
  if (denied) return denied;
  const { id } = await params;

  return <LeadDetailClient leadId={id} />;
}
