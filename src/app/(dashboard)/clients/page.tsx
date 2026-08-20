import type { Metadata } from "next";
import ClientDirectory from "@/components/clients/ClientDirectory";

export const metadata: Metadata = {
  title: "Clients",
};

export default function ClientsPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Client Account Directory
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          Converted client accounts, monthly retainers, onboarding questionnaires, and portal access
        </p>
      </div>

      <ClientDirectory />
    </div>
  );
}
