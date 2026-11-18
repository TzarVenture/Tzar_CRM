import type { Metadata } from "next";
import { denyUnlessAllowed } from "@/lib/page-access";
import dbConnect from "@/lib/db";
import { SmartLeadGrid } from "@/components/leads/SmartLeadGrid";
import { auth } from "@/lib/auth";
import { parseLeadListParams, queryLeads } from "@/lib/leads-query";

export const metadata: Metadata = {
  title: "Pipeline",
};

export const revalidate = 0; // Always fresh

export default async function PipelinePage() {
  const denied = await denyUnlessAllowed("leads.pipeline");
  if (denied) return denied;
  const session = await auth();
  await dbConnect();

  const userRole = session?.user?.role;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allowedBusinesses: string[] = (session?.user as any)?.allowedBusinesses || ["tzar", "titepo", "adshalaa", "crownleaf"];

  // Only the first page is loaded here. The grid asks the server for other pages, filters and searches.
  const firstPage = await queryLeads(parseLeadListParams(new URLSearchParams()), {
    seesAllBrands: userRole === "SUPER_ADMIN" || userRole === "ADMIN",
    allowedBusinesses,
  });

  // Serialize MongoDB documents for the client component (strips ObjectId and Date objects)
  const initialPage = JSON.parse(JSON.stringify(firstPage));

  return (
    <div className="animate-fade-in space-y-6">
      <SmartLeadGrid initialPage={initialPage} />
    </div>
  );
}
