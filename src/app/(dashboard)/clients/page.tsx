import type { Metadata } from "next";
import { denyUnlessAllowed } from "@/lib/page-access";
import ClientDirectory from "@/components/clients/ClientDirectory";

export const metadata: Metadata = {
  title: "Clients",
};

export default async function ClientsPage() {
  const denied = await denyUnlessAllowed("clients");
  if (denied) return denied;
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Clients
        </h1>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">
          Converted clients, monthly retainers, onboarding and portal access
        </p>
      </div>

      <ClientDirectory />
    </div>
  );
}
