import type { Metadata } from "next";
import FileManager from "@/components/files/FileManager";

export const metadata: Metadata = {
  title: "File Manager",
};

export default function FilesPage() {
  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Enterprise Document & Asset Storage
        </h1>
        <p className="text-sm font-semibold text-slate-600 mt-0.5">
          S3 presigned asset storage, access permissions, contracts, and proposals
        </p>
      </div>

      <FileManager />
    </div>
  );
}
