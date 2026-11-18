import type { Metadata } from "next";
import OwnerPage from "@/components/accounts/OwnerPage";
import AccountsOverview from "@/components/accounts/AccountsOverview";

export const metadata: Metadata = { title: "Accounts Overview" };

export default function AccountsPage() {
  return (
    <OwnerPage permission="accounts.overview" title="Accounts Overview" subtitle="How much came in, how much went out, and what you still need to collect">
      <AccountsOverview />
    </OwnerPage>
  );
}
