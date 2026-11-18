import type { Metadata } from "next";
import { denyUnlessAllowed } from "@/lib/page-access";
import ExpenseCenter from "@/components/expenses/ExpenseCenter";

export const metadata: Metadata = {
  title: "Expenses",
};

export default async function ExpensesPage() {
  const denied = await denyUnlessAllowed("accounts.expenses");
  if (denied) return denied;

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Expenses</h1>
        <p className="text-sm font-semibold text-muted-foreground mt-0.5">
          Record supplier bills, subscriptions and other business spend, with the GST paid on each
        </p>
      </div>

      <ExpenseCenter />
    </div>
  );
}
