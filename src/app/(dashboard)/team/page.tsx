import type { Metadata } from "next";
import TeamDirectory from "@/components/team/TeamDirectory";

export const metadata: Metadata = {
  title: "Team Directory",
};

export default function TeamPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Agency Team & RBAC Directory
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          Manage agency staff, BDE assignees, role permissions, and user accounts
        </p>
      </div>

      <TeamDirectory />
    </div>
  );
}
