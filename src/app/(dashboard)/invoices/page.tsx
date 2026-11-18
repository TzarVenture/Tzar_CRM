import type { Metadata } from "next";
import { denyUnlessAllowed } from "@/lib/page-access";
import InvoiceCenter from "@/components/invoices/InvoiceCenter";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const denied = await denyUnlessAllowed("accounts.invoices");
  if (denied) return denied;

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Invoices</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">
          Create GST tax invoices for all four brands and download them as PDF
        </p>
      </div>

      <InvoiceCenter />
    </div>
  );
}
