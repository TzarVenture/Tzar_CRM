"use client";

import { useState } from "react";
import { MessageCircle, Send, Bot } from "lucide-react";
import WhatsAppChatCenter from "@/components/chat/WhatsAppChatCenter";
import BulkBroadcastCenter from "@/components/chat/BulkBroadcastCenter";
import ChatbotFlowBuilder from "@/components/chat/ChatbotFlowBuilder";

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "broadcast" | "chatbot">("chat");

  return (
    <div className="animate-fade-in space-y-4">
      {/* Top Header & Sub-Nav Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-300">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            WhatsApp Omnichannel & Automation Center
          </h1>
          <p className="text-sm font-semibold text-slate-600 mt-0.5">
            Meta WhatsApp Business Cloud API, ChatbotWonder auto-responder, and bulk broadcast campaigns
          </p>
        </div>

        {/* Sub-Tabs (Responsive Swipeable on Mobile) */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1">
          <div className="inline-flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 gap-1">
            {[
              { id: "chat", label: "2-Way Live Chat", icon: MessageCircle },
              { id: "broadcast", label: "Bulk Broadcasts", icon: Send },
              { id: "chatbot", label: "AI Chatbot Rules", icon: Bot },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-emerald-600" : "text-slate-500"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Body */}
      {activeTab === "chat" && <WhatsAppChatCenter />}
      {activeTab === "broadcast" && <BulkBroadcastCenter />}
      {activeTab === "chatbot" && <ChatbotFlowBuilder />}
    </div>
  );
}
