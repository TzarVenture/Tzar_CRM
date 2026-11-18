import type { Metadata } from "next";
import OwnerPage from "@/components/accounts/OwnerPage";
import LedgerCenter from "@/components/accounts/LedgerCenter";

export const metadata: Metadata = { title: "Customer Ledger" };

export default function LedgerPage() {
  return (
    <OwnerPage permission="accounts.ledger" title="Customer Ledger" subtitle="Every customer's invoices, payments received and balance due">
      <LedgerCenter />
    </OwnerPage>
  );
}
