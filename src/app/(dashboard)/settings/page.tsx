import type { Metadata } from "next";
import SettingsCenter from "@/components/settings/SettingsCenter";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          System Settings & Platform Configuration
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          API Key management, Webhook endpoints, AWS S3 settings, and security controls
        </p>
      </div>

      <SettingsCenter />
    </div>
  );
}
