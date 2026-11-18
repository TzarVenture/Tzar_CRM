import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import TeamDirectory from "@/components/team/TeamDirectory";
import { AccessDenied } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    return <AccessDenied message="Only the owner can manage team members." />;
  }

  return (
    <div className="animate-fade-in">
      <TeamDirectory />
    </div>
  );
}
