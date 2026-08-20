import type { Metadata } from "next";
import ClientOnboardingPortal from "@/components/portal/ClientOnboardingPortal";

export const metadata: Metadata = {
  title: "Client Onboarding Portal",
};

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return <ClientOnboardingPortal clientId={clientId} />;
}
