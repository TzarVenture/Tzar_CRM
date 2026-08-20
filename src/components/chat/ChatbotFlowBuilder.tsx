"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Bot,
  Plus,
  Zap,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Sparkles,
  ArrowRight,
  Award,
  Layers,
} from "lucide-react";

interface RuleItem {
  _id: string;
  triggerKeyword: string;
  matchType: "EXACT" | "CONTAINS";
  actionType: "REPLY_TEXT" | "SEND_TEMPLATE" | "UPDATE_SCORE" | "CHANGE_STAGE";
  replyContent?: string;
  templateName?: string;
  targetStageId?: string;
  scoreBoost?: number;
  isActive: boolean;
  createdAt: string;
}

export default function ChatbotFlowBuilder() {
  const [rules, setRules] = useState<RuleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Rule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triggerKeyword, setTriggerKeyword] = useState("");
  const [matchType, setMatchType] = useState<"EXACT" | "CONTAINS">("CONTAINS");
  const [actionType, setActionType] = useState<
    "REPLY_TEXT" | "SEND_TEMPLATE" | "UPDATE_SCORE" | "CHANGE_STAGE"
  >("REPLY_TEXT");
  const [replyContent, setReplyContent] = useState("");
  const [targetStageId, setTargetStageId] = useState("discovery-call");
  const [scoreBoost, setScoreBoost] = useState<number>(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/v1/whatsapp/chatbot");
      setRules(res.data.rules || []);
    } catch (err) {
      console.error("Failed to fetch chatbot rules:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setIsSubmitting(true);
      await axios.post("/api/v1/whatsapp/chatbot", {
        triggerKeyword,
        matchType,
        actionType,
        replyContent,
        targetStageId,
        scoreBoost: Number(scoreBoost),
      });

      setIsModalOpen(false);
      setTriggerKeyword("");
      setReplyContent("");
      fetchRules();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to create chatbot rule");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automated chatbot rule?")) return;

    try {
      await axios.delete(`/api/v1/whatsapp/chatbot/${id}`);
      fetchRules();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

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
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ChatbotWonder AI Automation Rules Engine
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Automated 24/7 lead qualification, keyword triggers, score boosting & stage moves
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        >
          <Plus className="w-4 h-4" />
          Add Chatbot Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs font-semibold text-slate-500">
            Loading ChatbotWonder automation rules...
          </div>
        ) : rules.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs font-semibold text-slate-500">
            No active chatbot rules. Create your first automated keyword trigger above.
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule._id}
              className="bg-white rounded-2xl p-6 border border-slate-300 shadow-xs hover:border-(--color-brand-green) transition-all space-y-4 relative group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    {rule.matchType} MATCH
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                    Keyword: &quot;{rule.triggerKeyword}&quot;
                  </h3>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule._id)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                  title="Delete Chatbot Rule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Action: {rule.actionType.replace("_", " ")}
                </div>

                {rule.replyContent && (
                  <p className="text-slate-600 font-medium whitespace-pre-wrap leading-relaxed">
                    &quot;{rule.replyContent}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-200">
                  <span className="flex items-center gap-1 text-amber-600">
                    <Award className="w-3 h-3" /> +{rule.scoreBoost || 5} pts boost
                  </span>

                  {rule.targetStageId && (
                    <span className="flex items-center gap-1 text-(--color-brand-green)">
                      <Layers className="w-3 h-3" /> Move to {rule.targetStageId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="relative w-full max-w-md bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-modal)" }}
          >
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: "var(--color-brand-green)" }}
            />

            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <Bot className="w-5 h-5 text-(--color-brand-green)" />
                <h3 className="text-base font-bold text-slate-900">
                  Create Chatbot Wonder Trigger Rule
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trigger Keyword / Phrase *
                </label>
                <input
                  type="text"
                  required
                  value={triggerKeyword}
                  onChange={(e) => setTriggerKeyword(e.target.value)}
                  placeholder="e.g. pricing, book call, portfolio"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Match Type
                  </label>
                  <select
                    value={matchType}
                    onChange={(e) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setMatchType(e.target.value as any)
                    }
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                  >
                    <option value="CONTAINS">Contains Keyword</option>
                    <option value="EXACT">Exact Match Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setActionType(e.target.value as any)
                    }
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                  >
                    <option value="REPLY_TEXT">Auto Reply Text</option>
                    <option value="CHANGE_STAGE">Move Stage & Reply</option>
                    <option value="UPDATE_SCORE">Boost Lead Score</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Automated Reply Content
                </label>
                <textarea
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type the message the bot will send when triggered..."
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                />
              </div>

              {actionType === "CHANGE_STAGE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Move Lead to Stage
                  </label>
                  <select
                    value={targetStageId}
                    onChange={(e) => setTargetStageId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
                  >
                    <option value="discovery-call">Discovery Call</option>
                    <option value="proposal-sent">Proposal Sent</option>
                    <option value="negotiation">Negotiation</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Score Boost Points
                </label>
                <input
                  type="number"
                  value={scoreBoost}
                  onChange={(e) => setScoreBoost(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 outline-none"
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
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Save Chatbot Rule
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
