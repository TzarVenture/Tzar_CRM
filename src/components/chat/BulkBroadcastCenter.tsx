"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { format } from "date-fns";
import { PRE_APPROVED_TEMPLATES, HsmTemplate } from "./HsmTemplateModal";

interface BroadcastItem {
  _id: string;
  name: string;
  templateName: string;
  templateParams: string[];
  targetFilter: {
    stageId?: string;
    minBudget?: number;
    serviceTag?: string;
  };
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  status: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export default function BulkBroadcastCenter() {
  const [campaigns, setCampaigns] = useState<BroadcastItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<HsmTemplate>(
    PRE_APPROVED_TEMPLATES[0]
  );
  const [targetStageId, setTargetStageId] = useState("");
  const [minBudget, setMinBudget] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/v1/whatsapp/broadcast");
      setCampaigns(res.data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch broadcast campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await axios.post("/api/v1/whatsapp/broadcast", {
        name,
        templateName: selectedTemplate.name,
        templateParams: ["Valued Client", "Digital Services"],
        targetFilter: {
          ...(targetStageId ? { stageId: targetStageId } : {}),
          ...(minBudget > 0 ? { minBudget: Number(minBudget) } : {}),
        },
      });

      setIsModalOpen(false);
      setName("");
      fetchCampaigns();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to dispatch broadcast");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalBroadcastsSent = campaigns.reduce(
    (sum, c) => sum + (c.totalRecipients || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview Header Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-300 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl text-white font-bold"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bulk WhatsApp Broadcast Campaign Engine
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Send pre-approved Meta HSM broadcast templates to targeted lead segments
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-emerald-700"
          style={{ backgroundColor: "var(--color-status-success)" }}
        >
          <Plus className="w-4 h-4" />
          New Broadcast Campaign
        </button>
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-(--color-brand-green)" />
            <h3 className="text-sm font-bold text-slate-900">
              Broadcast Campaign History & Delivery Stats
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {campaigns.length} Campaigns Created · {totalBroadcastsSent} Total Messages Dispatched
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Campaign Name</th>
                <th className="py-3.5 px-4">Template</th>
                <th className="py-3.5 px-4">Target Segment</th>
                <th className="py-3.5 px-4">Recipients</th>
                <th className="py-3.5 px-4">Delivered %</th>
                <th className="py-3.5 px-4">Read %</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Loading broadcast campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No broadcast campaigns sent yet. Create a new campaign to reach target leads.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const deliveryPct = c.totalRecipients > 0 ? ((c.deliveredCount / c.totalRecipients) * 100).toFixed(0) : "0";
                  const readPct = c.totalRecipients > 0 ? ((c.readCount / c.totalRecipients) * 100).toFixed(0) : "0";
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-xs">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {format(new Date(c.createdAt), "MMM d, yyyy · h:mm a")}
                        </p>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-700">
                        {c.templateName}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {c.targetFilter?.stageId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">
                            Stage: {c.targetFilter.stageId}
                          </span>
                        ) : (
                          <span className="text-slate-500">All Active Leads</span>
                        )}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {c.totalRecipients} leads
                      </td>
                      <td className="py-4 px-4 font-bold text-emerald-700">
                        {c.deliveredCount} ({deliveryPct}%)
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-700">
                        {c.readCount} ({readPct}%)
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> COMPLETED
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Broadcast Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: "var(--color-status-success)" }}
            />

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  New Bulk WhatsApp Broadcast
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBroadcast} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q1 Web Revamp Promo Broadcast"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Meta Verified HSM Template *
                </label>
                <select
                  value={selectedTemplate.id}
                  onChange={(e) => {
                    const tpl = PRE_APPROVED_TEMPLATES.find((t) => t.id === e.target.value);
                    if (tpl) setSelectedTemplate(tpl);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none cursor-pointer"
                >
                  {PRE_APPROVED_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayName} ({t.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Segment Stage Filter
                </label>
                <select
                  value={targetStageId}
                  onChange={(e) => setTargetStageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none cursor-pointer"
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
                  Min Estimated Budget ($)
                </label>
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl disabled:opacity-50 hover:bg-emerald-700"
                  style={{ backgroundColor: "var(--color-status-success)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Dispatch Broadcast
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
