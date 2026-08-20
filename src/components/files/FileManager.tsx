"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FolderOpen,
  Upload,
  Lock,
  Eye,
  FileText,
  CheckCircle2,
  Download,
  Filter,
  Search,
  X,
  Loader2,
  Paperclip,
  Building,
  User as UserIcon,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

interface FileItem {
  _id: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: "CONTRACT" | "PROPOSAL" | "DESIGN_ASSET" | "INVOICE" | "OTHER";
  accessLevel: "INTERNAL_ONLY" | "PUBLIC_CLIENT";
  uploadedBy?: { name: string; email: string; role: string };
  relatedLeadId?: { fullName: string; leadCustomId: string };
  relatedClientId?: { companyName: string; clientCustomId: string };
  createdAt: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Upload Modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [category, setCategory] = useState<
    "CONTRACT" | "PROPOSAL" | "DESIGN_ASSET" | "INVOICE" | "OTHER"
  >("OTHER");
  const [accessLevel, setAccessLevel] = useState<"INTERNAL_ONLY" | "PUBLIC_CLIENT">(
    "INTERNAL_ONLY"
  );
  const [isUploading, setIsUploading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (selectedCategory) params.category = selectedCategory;
      if (selectedAccessLevel) params.accessLevel = selectedAccessLevel;

      const res = await axios.get("/api/v1/files/commit", { params });
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedAccessLevel]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setIsUploading(true);

      // 1. Get Presigned URL
      const presignedRes = await axios.post("/api/v1/files/presigned", {
        fileName: uploadFile.name,
        fileType: uploadFile.type || "application/octet-stream",
        fileSize: uploadFile.size,
        category,
        accessLevel,
      });

      const { fileKey, fileUrl } = presignedRes.data;

      // 2. Commit file record to DB
      await axios.post("/api/v1/files/commit", {
        fileName: uploadFile.name,
        fileKey,
        fileUrl,
        fileSize: uploadFile.size,
        mimeType: uploadFile.type || "application/octet-stream",
        category,
        accessLevel,
      });

      setIsUploadModalOpen(false);
      setUploadFile(null);
      fetchFiles();
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredFiles = files.filter(
    (f) =>
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs"
      >
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "", label: "All Assets" },
            { id: "CONTRACT", label: "Contracts" },
            { id: "PROPOSAL", label: "Proposals" },
            { id: "DESIGN_ASSET", label: "Design Assets" },
            { id: "INVOICE", label: "Invoices" },
          ].map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-(--color-brand-green) text-white border-(--color-brand-green) shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {/* Access Filter */}
          <select
            value={selectedAccessLevel}
            onChange={(e) => setSelectedAccessLevel(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 outline-none cursor-pointer"
          >
            <option value="">All Access Levels</option>
            <option value="INTERNAL_ONLY">Internal Staff Only</option>
            <option value="PUBLIC_CLIENT">Client Portal Visible</option>
          </select>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <Upload className="w-4 h-4" />
            Upload File Asset
          </button>
        </div>
      </div>

      {/* Files Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-(--color-brand-green)" />
            <h3 className="text-sm font-bold text-slate-900">
              Document Assets Directory
            </h3>
          </div>

          <div className="relative max-w-xs flex-1 ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Document Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Access Level</th>
                <th className="py-3.5 px-4">Uploaded By</th>
                <th className="py-3.5 px-4">Associated Entity</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Loading asset catalog...
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No files found in directory. Upload a new asset to get started.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-5 flex items-center gap-3">
                      <Paperclip className="w-4 h-4 text-(--color-brand-green) shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 text-xs">
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {format(new Date(file.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-slate-700">
                        {file.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-4 px-4">
                      {file.accessLevel === "PUBLIC_CLIENT" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Eye className="w-3 h-3" /> Client Portal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                          <Lock className="w-3 h-3 text-slate-500" /> Internal Staff
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      {file.uploadedBy?.name || "Staff Member"}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {file.relatedLeadId ? (
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {file.relatedLeadId.leadCustomId} ({file.relatedLeadId.fullName})
                        </span>
                      ) : file.relatedClientId ? (
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {file.relatedClientId.clientCustomId} ({file.relatedClientId.companyName})
                        </span>
                      ) : (
                        <span className="text-slate-400">General Agency Asset</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-(--color-brand-green) hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                        <button
                          onClick={async () => {
                            if (confirm(`Delete file asset "${file.fileName}"?`)) {
                              await axios.delete(`/api/v1/files/${file._id}`);
                              fetchFiles();
                            }
                          }}
                          className="p-1 rounded text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete File Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: "var(--color-brand-green)" }}
            />

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-(--color-brand-green)" />
                <h3 className="text-base font-bold text-slate-900">
                  Upload Document Asset
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select File *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-semibold text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-(--color-brand-green) file:text-white hover:file:bg-(--color-brand-green-hover) cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Asset Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setCategory(e.target.value as any)
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                >
                  <option value="OTHER">General Document</option>
                  <option value="CONTRACT">Contract & Agreement</option>
                  <option value="PROPOSAL">Project Proposal</option>
                  <option value="DESIGN_ASSET">Design & Brand Asset</option>
                  <option value="INVOICE">Invoice & Payment Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Access & Visibility Control
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccessLevel("INTERNAL_ONLY")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      accessLevel === "INTERNAL_ONLY"
                        ? "border-(--color-brand-green) bg-(--color-brand-green-light) text-(--color-brand-green)"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Lock className="w-4 h-4" /> Internal Only
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccessLevel("PUBLIC_CLIENT")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      accessLevel === "PUBLIC_CLIENT"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-slate-300 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Eye className="w-4 h-4 text-emerald-600" /> Client Visible
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
