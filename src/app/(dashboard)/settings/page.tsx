import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import SettingsCenter from "@/components/settings/SettingsCenter";
import { AccessDenied } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  if (session?.user?.role !== "SUPER_ADMIN") {
    return <AccessDenied message="Only the owner can view integration keys and access settings." />;
  }

  return (
    <div className="animate-fade-in">
      <SettingsCenter />
    </div>
  );
}
