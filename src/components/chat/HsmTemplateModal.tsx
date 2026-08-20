"use client";

import { useState } from "react";
import { X, FileText, Send, Check, MessageSquare } from "lucide-react";

export interface HsmTemplate {
  id: string;
  name: string;
  displayName: string;
  category: "UTILITY" | "MARKETING";
  bodyTemplate: string;
  variablesCount: number;
}

export const PRE_APPROVED_TEMPLATES: HsmTemplate[] = [
  {
    id: "hello_world",
    name: "hello_world",
    displayName: "Meta Official Default (hello_world)",
    category: "UTILITY",
    bodyTemplate:
      "Welcome and thank you for choosing WhatsApp Business Cloud API.",
    variablesCount: 0,
  },
  {
    id: "tzar_lead_welcome_v1",
    name: "tzar_lead_welcome_v1",
    displayName: "Welcome & Discovery Call",
    category: "UTILITY",
    bodyTemplate:
      "Hi {{1}}, thank you for reaching out to Tzar Agency. Our team has reviewed your {{2}} inquiry. When would be a convenient time for a brief discovery call?",
    variablesCount: 2,
  },
  {
    id: "tzar_proposal_followup_v1",
    name: "tzar_proposal_followup_v1",
    displayName: "Proposal Review Follow-up",
    category: "UTILITY",
    bodyTemplate:
      "Hi {{1}}, following up on the project proposal we shared for {{2}}. Have you had a chance to review the scope? Let us know if you'd like to schedule a call.",
    variablesCount: 2,
  },
  {
    id: "tzar_meeting_reminder_v1",
    name: "tzar_meeting_reminder_v1",
    displayName: "Meeting Reminder",
    category: "UTILITY",
    bodyTemplate:
      "Hi {{1}}, just a quick reminder about our scheduled strategy session for {{2}}. Here is the link to join: {{3}}.",
    variablesCount: 3,
  },
  {
    id: "tzar_onboarding_invite_v1",
    name: "tzar_onboarding_invite_v1",
    displayName: "Client Onboarding Portal Invite",
    category: "UTILITY",
    bodyTemplate:
      "Hi {{1}}, welcome aboard! Please complete your brand onboarding questionnaire here: {{2}} so we can kick off {{3}}.",
    variablesCount: 3,
  },
];

interface HsmTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadName?: string;
  serviceName?: string;
  onSelectTemplate: (
    template: HsmTemplate,
    compiledText: string,
    params: string[]
  ) => void;
}

export default function HsmTemplateModal({
  isOpen,
  onClose,
  leadName = "Client",
  serviceName = "Website Development",
  onSelectTemplate,
}: HsmTemplateModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<HsmTemplate>(
    PRE_APPROVED_TEMPLATES[0]
  );
  const [param1, setParam1] = useState(leadName);
  const [param2, setParam2] = useState(serviceName);
  const [param3, setParam3] = useState("https://tzar.agency/portal");

  if (!isOpen) return null;

  const getCompiledMessage = (tpl: HsmTemplate) => {
    let result = tpl.bodyTemplate;
    result = result.replace("{{1}}", param1 || leadName);
    result = result.replace("{{2}}", param2 || serviceName);
    result = result.replace("{{3}}", param3 || "link");
    return result;
  };

  const handleSend = () => {
    const compiled = getCompiledMessage(selectedTemplate);
    const params = [param1 || leadName, param2 || serviceName, param3].slice(
      0,
      selectedTemplate.variablesCount
    );
    onSelectTemplate(selectedTemplate, compiled, params);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-300 shadow-2xl overflow-hidden"
        style={{ boxShadow: "var(--shadow-modal)" }}
      >
        {/* Accent Bar */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: "var(--color-brand-green)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: "var(--color-status-success-bg)" }}
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Meta WhatsApp Pre-Approved HSM Templates
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Select a verified business message template for high delivery rates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Grid: Left Template Selector & Right Live Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 p-7 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Left: Template Picker */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Template
            </label>
            {PRE_APPROVED_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "border-(--color-brand-green) bg-(--color-brand-green-light)/40 shadow-xs"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {tpl.displayName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {tpl.name}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Variable Customization & Live Preview */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Template Variables
            </label>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Var {"{{1}}"} (Lead Name)
                </label>
                <input
                  type="text"
                  value={param1}
                  onChange={(e) => setParam1(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Var {"{{2}}"} (Service / Topic)
                </label>
                <input
                  type="text"
                  value={param2}
                  onChange={(e) => setParam2(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white outline-none"
                />
              </div>

              {selectedTemplate.variablesCount >= 3 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Var {"{{3}}"} (Link / Parameter)
                  </label>
                  <input
                    type="text"
                    value={param3}
                    onChange={(e) => setParam3(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Live Message Preview Box */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Live Message Preview
              </label>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                {getCompiledMessage(selectedTemplate)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer hover:bg-emerald-700"
            style={{ backgroundColor: "var(--color-status-success)" }}
          >
            <Send className="w-4 h-4" /> Insert Template Message
          </button>
        </div>
      </div>
    </div>
  );
}
