import type { Metadata } from "next";
import OwnerPage from "@/components/accounts/OwnerPage";
import GstReports from "@/components/accounts/GstReports";

export const metadata: Metadata = { title: "GST Reports" };

export default function GstReportsPage() {
  return (
    <OwnerPage permission="accounts.gst" title="GST Reports" subtitle="Month-wise GSTR-1 and GSTR-3B working sheets, and the Tally export">
      <GstReports />
    </OwnerPage>
  );
}
