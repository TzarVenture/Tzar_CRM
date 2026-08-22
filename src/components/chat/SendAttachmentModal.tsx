"use client";

import { useState } from "react";
import { X, FileText, Image as ImageIcon, Link as LinkIcon, Upload, Send, CheckCircle2 } from "lucide-react";
import axios from "axios";

interface SendAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId?: string;
  recipientPhone: string;
  recipientName: string;
  onAttachmentSent: () => void;
}

export default function SendAttachmentModal({
  isOpen,
  onClose,
  leadId,
  recipientPhone,
  recipientName,
  onAttachmentSent,
}: SendAttachmentModalProps) {
  const [attachmentType, setAttachmentType] = useState<"document" | "image">("document");
  const [fileUrl, setFileUrl] = useState("");
  const [filename, setFilename] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  // Local File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    // Auto detect type
    if (file.type.startsWith("image/")) {
      setAttachmentType("image");
    } else {
      setAttachmentType("document");
    }

    setFilename(file.name);

    // Read local file as Data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFileUrl(reader.result);
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read selected local file.");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      setErrorMsg("Please select a file or enter a valid media URL.");
      return;
    }

    try {
      setIsSending(true);
      setErrorMsg("");

      await axios.post("/api/v1/whatsapp/send", {
        leadId,
        recipientPhone,
        messageType: attachmentType,
        mediaUrl: fileUrl.trim(),
        filename: filename.trim() || (attachmentType === "document" ? "Brochure.pdf" : "Image.png"),
        content: caption.trim() || `[Attachment: ${attachmentType}]`,
      });

      setFileUrl("");
      setFilename("");
      setCaption("");
      onAttachmentSent();
      onClose();
    } catch (err: any) {
      console.error("Failed to send attachment:", err);
      setErrorMsg(err.response?.data?.error || "Failed to dispatch media attachment");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Send WhatsApp Media Attachment</h3>
              <p className="text-xs font-semibold text-slate-500">To {recipientName} ({recipientPhone})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Option A: Direct Local File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Local File from Computer
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 p-4 rounded-xl cursor-pointer transition-all">
              <Upload className="w-6 h-6 text-emerald-600 mb-1" />
              <span className="text-xs font-bold text-slate-800">
                {isUploading ? "Reading file..." : "Click to Browse Local File (PDF / Images)"}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Supports PDF brochures, contracts, PNG, JPEG
              </span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {filename && fileUrl && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                <span className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {filename}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
                  {attachmentType}
                </span>
              </div>
            )}
          </div>

          {/* Option B: Public Media URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              OR Paste Public File / Media URL
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="url"
                value={fileUrl.startsWith("data:") ? "" : fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder={
                  attachmentType === "document"
                    ? "https://tzar-crm.vercel.app/docs/proposal.pdf"
                    : "https://tzar-crm.vercel.app/images/banner.png"
                }
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Attachment Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attachment Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAttachmentType("document")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  attachmentType === "document"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                PDF Document
              </button>

              <button
                type="button"
                onClick={() => setAttachmentType("image")}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  attachmentType === "image"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                Image (PNG/JPEG)
              </button>
            </div>
          </div>

          {/* Caption Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Message Caption (Optional)
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Here is the attachment for your review..."
              className="w-full px-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || isUploading || !fileUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Attachment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
