"use client";

import { useState } from "react";
import { X, FileText, Image as ImageIcon, Link as LinkIcon, Upload, Send } from "lucide-react";
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
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      setErrorMsg("Please enter a valid public media URL or file link.");
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
              <h3 className="text-base font-bold text-slate-900">Send WhatsApp Attachment</h3>
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

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Attachment Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Attachment Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAttachmentType("document");
                  if (!filename) setFilename("Tzar_Agency_Brochure.pdf");
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  attachmentType === "document"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs"
                    : "border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                PDF Document / Brochure
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttachmentType("image");
                  if (!filename) setFilename("Project_Banner.png");
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
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

          {/* Public Media URL Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Public File / Media URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="url"
                required
                value={fileUrl}
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

          {/* Filename Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              File Name Display
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. Tzar_Company_Profile.pdf"
              className="w-full px-4 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
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
              placeholder="Here is the PDF proposal for your review..."
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
              disabled={isSending}
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
