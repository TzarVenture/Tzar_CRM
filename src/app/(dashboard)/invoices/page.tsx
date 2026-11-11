import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import InvoiceCenter from "@/components/invoices/InvoiceCenter";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return (
      <div className="p-12 text-center bg-rose-50/70 border border-rose-200 rounded-3xl space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">403 Access Forbidden</h2>
          <p className="text-xs font-semibold text-slate-600 mt-1">
            Invoices can only be created and viewed by the owner account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          Create GST tax invoices for all four brands and download them as PDF or Word
        </p>
      </div>

      <InvoiceCenter />
    </div>
  );
}
