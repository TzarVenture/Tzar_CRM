import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tzar Enterprise CRM",
    template: "%s | Tzar CRM",
  },
  description:
    "Enterprise-grade CRM and agency operations platform for Tzar. Manage leads, clients, WhatsApp communications, Meta Ads, and team workflows in one place.",
  robots: { index: false, follow: false }, // Internal tool — no indexing
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
