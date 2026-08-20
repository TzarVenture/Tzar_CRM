import type { Metadata } from "next";
import LeadDetailClient from "@/components/leads/LeadDetailClient";

export const metadata: Metadata = {
  title: "360° Lead Profile",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <LeadDetailClient leadId={id} />;
}
