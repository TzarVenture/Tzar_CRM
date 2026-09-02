"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Send,
  Users,
  CheckCircle2,
  X,
  Loader2,
  FileText,
  DollarSign,
  Layers,
  Plus,
  BarChart3,
  Paperclip,
  Eye,
  AlertCircle,
  Briefcase,
  BookOpen,
  Gift,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { BusinessSlug } from "@/models/Lead";

interface BroadcastItem {
  _id: string;
  name: string;
  business?: BusinessSlug;
  templateName: string;
  templateLanguage: string;
  templateParams: string[];
  mediaAttachment?: {
    type: "document" | "image";
    url?: string;
    filename?: string;
  };
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  status: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

interface MetaTemplateItem {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  headerFormat: string;
  bodyText: string;
  exampleVars: string[];
  components: any[];
}

export default function BulkBroadcastCenter() {
  const [campaigns, setCampaigns] = useState<BroadcastItem[]>([]);
  const [metaTemplates, setMetaTemplates] = useState<MetaTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // New Broadcast Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [targetBusiness, setTargetBusiness] = useState<string>("titepo");
  const [targetStageId, setTargetStageId] = useState("");
  const [minBudget, setMinBudget] = useState<number>(0);

  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("titepo_inquiry_welcome_v1");
  const [templateLanguage, setTemplateLanguage] = useState("en_US");
  const [hasMediaAttachment, setHasMediaAttachment] = useState(false);
  const [mediaType, setMediaType] = useState<"document" | "image">("document");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFilename, setMediaFilename] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await axios.get("/api/v1/whatsapp/broadcast");
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch broadcast campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch live Meta templates
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get("/api/v1/whatsapp/templates");
      const list = res.data?.templates || [];
      setMetaTemplates(list);
      if (list.length > 0 && !list.find((t: any) => t.name === selectedTemplateName)) {
        setSelectedTemplateName(list[0].name);
      }
    } catch (err) {
      console.warn("Could not fetch Meta Cloud templates:", err);
    }
  }, [selectedTemplateName]);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, [fetchCampaigns, fetchTemplates]);

  // Auto-refresh active campaigns
  useEffect(() => {
    const hasActive = campaigns.some((c) => c.status === "PROCESSING" || c.status === "QUEUED");
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 4000);

    return () => clearInterval(interval);
  }, [campaigns, fetchCampaigns]);

  // Open Campaign Audit Details
  const handleOpenDetails = async (campaignId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await axios.get(`/api/v1/whatsapp/broadcast/${campaignId}`);
      setSelectedCampaign(res.data.campaign);
    } catch (err) {
      console.error("Failed to fetch campaign details:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Dispatch Broadcast Campaign
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        name: campaignName,
        business: targetBusiness || undefined,
        templateName: selectedTemplateName,
        templateLanguage,
        targetFilter: {
          business: targetBusiness || undefined,
          stageId: targetStageId || undefined,
          minBudget: minBudget > 0 ? Number(minBudget) : undefined,
        },
      };

      if (hasMediaAttachment && mediaUrl) {
        payload.mediaAttachment = {
          type: mediaType,
          url: mediaUrl,
          filename: mediaFilename || (mediaType === "document" ? "Catalog.pdf" : "Banner.png"),
        };
      }

      await axios.post("/api/v1/whatsapp/broadcast", payload);

      setIsModalOpen(false);
      setCampaignName("");
      setMediaUrl("");
      setMediaFilename("");
      setHasMediaAttachment(false);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to dispatch broadcast campaign");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find currently selected template object
  const activeTemplateObj = metaTemplates.find((t) => t.name === selectedTemplateName);

  // Generate preview text
  const previewBody = activeTemplateObj
    ? activeTemplateObj.bodyText
        .replace(/{{1}}/g, "Rahul Sharma")
        .replace(/{{2}}/g, targetBusiness === "titepo" ? "Birthday Return Gifts" : "Digital Services")
    : "Hi Rahul Sharma, thank you for contacting our team...";

  const totalBroadcastsSent = campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
  const totalRecipientsCount = campaigns.reduce((sum, c) => sum + (c.totalRecipients || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Enterprise WhatsApp Bulk Broadcast Engine
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              AiSensy & Wati-grade bulk messaging via Meta Cloud API with PDF brochures, rate pacing, and dynamic variables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCampaigns()}
            className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Campaign Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer bg-emerald-700 hover:bg-emerald-800"
          >
            <Plus className="w-4 h-4" />
            New Broadcast Campaign
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-medium text-slate-500">Total Campaigns</p>
          <p className="text-2xl font-black text-slate-900">{campaigns.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-medium text-slate-500">Target Recipients</p>
          <p className="text-2xl font-black text-blue-700">{totalRecipientsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-medium text-slate-500">Messages Dispatched</p>
          <p className="text-2xl font-black text-emerald-700">{totalBroadcastsSent}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-xs font-medium text-slate-500">Meta API Status</p>
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Cloud v20.0 Connected
          </p>
        </div>
      </div>

      {/* Campaign History Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Broadcast Campaign History & Real-Time Delivery Stats
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {campaigns.length} Campaigns Created · {totalBroadcastsSent} Dispatched
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Target Business</th>
                <th className="py-3 px-4">HSM Template</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Sent</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading broadcast campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No broadcast campaigns launched yet. Create a campaign to start reaching target leads on WhatsApp.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {c.name}
                      {c.mediaAttachment?.url && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 ml-2 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Paperclip className="w-2.5 h-2.5" /> PDF / Media
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="capitalize font-bold text-xs">
                        {c.business || "All Brands"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {c.templateName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.totalRecipients}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{c.sentCount}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{c.failedCount || 0}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          c.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : c.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-800 border-blue-200 animate-pulse"
                            : c.status === "QUEUED"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy h:mm a") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(c._id)}
                        className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        title="View Recipient Logs & Delivery Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">New Meta WhatsApp Broadcast Campaign</h2>
                  <p className="text-xs font-semibold text-slate-500">
                    Dispatch verified HSM templates with rich PDF brochure attachments
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="p-7 space-y-5 max-h-[82vh] overflow-y-auto">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}

              {/* Campaign Title & Brand Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Titepo Return Gifts Festive Catalog Blast"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Business Unit *
                  </label>
                  <select
                    value={targetBusiness}
                    onChange={(e) => {
                      const b = e.target.value;
                      setTargetBusiness(b);
                      if (b === "titepo") setSelectedTemplateName("titepo_inquiry_welcome_v1");
                      else if (b === "tzar") setSelectedTemplateName("tzar_lead_welcome_v1");
                      else if (b === "adshalaa") setSelectedTemplateName("adshalaa_course_inquiry_v1");
                      else if (b === "crownleaf") setSelectedTemplateName("crownleaf_welcome_lead_v1");
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="titepo">Titepo Toys & Return Gifts</option>
                    <option value="tzar">Tzar Agency (WebDev & Marketing)</option>
                    <option value="adshalaa">Adshalaa EdTech Institute</option>
                    <option value="crownleaf">CrownLeaf Corporate Gifting</option>
                    <option value="">All Business Units</option>
                  </select>
                </div>
              </div>

              {/* Target Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Pipeline Stage
                  </label>
                  <select
                    value={targetStageId}
                    onChange={(e) => setTargetStageId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="">All Active Pipeline Leads</option>
                    <option value="new-lead">New Leads</option>
                    <option value="contacted">Contacted</option>
                    <option value="discovery-call">Discovery Call</option>
                    <option value="proposal-sent">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Budget Filter (₹)
                  </label>
                  <input
                    type="number"
                    value={minBudget}
                    onChange={(e) => setMinBudget(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Meta Verified HSM Template Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Meta Verified Template *
                </label>
                <select
                  value={selectedTemplateName}
                  onChange={(e) => {
                    setSelectedTemplateName(e.target.value);
                    const found = metaTemplates.find((t) => t.name === e.target.value);
                    if (found?.language) setTemplateLanguage(found.language);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer font-mono"
                >
                  {metaTemplates.map((t) => (
                    <option key={t.id || t.name} value={t.name}>
                      {t.name} ({t.category} · {t.language})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Variable Mapping Studio */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Template Variable Parameters ({activeTemplateObj?.exampleVars?.length || 2})</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Auto-Personalized per Lead
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">Variable &#123;&#123;1&#125;&#125;</span>
                    <span className="font-semibold text-slate-700">Lead Full Name (e.g. Shifa Naik)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-700">Variable &#123;&#123;2&#125;&#125;</span>
                    <span className="font-semibold text-slate-700">
                      {targetBusiness === "titepo"
                        ? "Event Occasion (e.g. Birthday Party)"
                        : targetBusiness === "adshalaa"
                        ? "Course Name (e.g. Digital Marketing)"
                        : targetBusiness === "crownleaf"
                        ? "Hamper Occasion (e.g. Diwali Kit)"
                        : "Required Service (e.g. WebDev)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Live Preview Box */}
              <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-300 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>LIVE RECIPIENT MESSAGE PREVIEW (PERSONALIZED)</span>
                  <span className="text-emerald-700 font-extrabold">Meta Verified HSM</span>
                </div>

                <div className="max-w-md bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200/80 space-y-2.5 text-xs font-medium text-slate-800">
                  {hasMediaAttachment && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-blue-700">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span>{mediaFilename || (mediaType === "document" ? "Catalog_Brochure.pdf" : "Image.png")}</span>
                    </div>
                  )}
                  <p className="whitespace-pre-line leading-relaxed">
                    {(activeTemplateObj?.bodyText || "")
                      .replace(/\{\{1\}\}/g, "[Lead: Shifa Naik]")
                      .replace(
                        /\{\{2\}\}/g,
                        targetBusiness === "titepo"
                          ? "[Inquiry: Birthday Party Return Gifts]"
                          : targetBusiness === "adshalaa"
                          ? "[Inquiry: Digital Marketing & AI Masterclass]"
                          : targetBusiness === "crownleaf"
                          ? "[Inquiry: Corporate Festival Hampers]"
                          : "[Inquiry: Shopify E-Commerce Store]"
                      )}
                  </p>
                  <div className="flex justify-end text-[10px] text-slate-400 font-bold">
                    Just now · Delivered
                  </div>
                </div>
              </div>

              {/* Rich PDF / Media Attachment Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="attachMedia"
                    checked={hasMediaAttachment}
                    onChange={(e) => setHasMediaAttachment(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="attachMedia" className="text-xs font-extrabold text-slate-800 cursor-pointer">
                    Attach Rich Document / PDF Brochure Header
                  </label>
                </div>

                {hasMediaAttachment && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Public Media URL *</label>
                      <input
                        type="url"
                        required={hasMediaAttachment}
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://yourdomain.com/catalogs/return_gifts.pdf"
                        className="w-full px-3 py-2 text-xs font-medium bg-white rounded-xl border border-slate-300 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Display Filename</label>
                      <input
                        type="text"
                        value={mediaFilename}
                        onChange={(e) => setMediaFilename(e.target.value)}
                        placeholder="e.g. Titepo_Return_Gifts_2026.pdf"
                        className="w-full px-3 py-2 text-xs font-medium bg-white rounded-xl border border-slate-300 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Launch Broadcast Campaign
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Details / Audit Log Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/60">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCampaign.name}</h3>
                <p className="text-xs font-semibold text-slate-500">
                  Template: {selectedCampaign.templateName} · Status: {selectedCampaign.status}
                </p>
              </div>

              <button
                onClick={() => setSelectedCampaign(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-7 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-500">Total Targeted</p>
                  <p className="text-xl font-extrabold text-slate-900">{selectedCampaign.totalRecipients}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[11px] font-bold text-emerald-700">Successfully Sent</p>
                  <p className="text-xl font-extrabold text-emerald-700">{selectedCampaign.sentCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[11px] font-bold text-blue-700">Delivered / Read</p>
                  <p className="text-xl font-extrabold text-blue-700">{selectedCampaign.deliveredCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <p className="text-[11px] font-bold text-rose-700">Failed Dispatches</p>
                  <p className="text-xl font-extrabold text-rose-700">{selectedCampaign.failedCount || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  Recipient Dispatch Log ({selectedCampaign.recipientLogs?.length || 0})
                </h4>

                <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Lead Name</th>
                        <th className="p-2.5">Phone Number</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Message ID / Error</th>
                        <th className="p-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedCampaign.recipientLogs || []).map((log: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-slate-900">{log.name || "Lead"}</td>
                          <td className="p-2.5 font-mono text-slate-600">{log.phone}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === "SENT" || log.status === "DELIVERED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">
                            {log.errorReason ? (
                              <span className="text-rose-600 font-semibold">{log.errorReason}</span>
                            ) : (
                              log.messageId || "—"
                            )}
                          </td>
                          <td className="p-2.5 text-slate-400 text-[11px]">
                            {log.sentAt ? format(new Date(log.sentAt), "h:mm:ss a") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
