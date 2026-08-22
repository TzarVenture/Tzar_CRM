"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Search,
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  FileText,
  User as UserIcon,
  Phone,
  Mail,
  Building,
  RefreshCw,
  Plus,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import HsmTemplateModal, { HsmTemplate } from "./HsmTemplateModal";
import SendAttachmentModal from "./SendAttachmentModal";

interface ContactLead {
  _id: string;
  leadCustomId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface MessageItem {
  _id: string;
  leadId?: string;
  channel: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  mediaUrls?: string[];
  mediaType?: "image" | "document" | "audio" | "video";
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  senderInfo?: { name: string; phoneOrEmail?: string };
  createdAt: string;
}

export default function WhatsAppChatCenter() {
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<ContactLead | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");

  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const fetchLeads = useCallback(async () => {
    try {
      setIsLoadingLeads(true);
      const res = await axios.get("/api/v1/leads");
      const fetchedLeads: ContactLead[] = res.data.leads || [];
      setLeads(fetchedLeads);

      if (fetchedLeads.length > 0 && !selectedLead) {
        setSelectedLead(fetchedLeads[0]);
      }
    } catch (err) {
      console.error("Failed to fetch contact leads:", err);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [selectedLead]);

  // Fetch messages for selected conversation (silent background polling prevents screen flash)
  const fetchConversation = useCallback(async (leadId: string, isSilent = false) => {
    try {
      if (!isSilent) setIsLoadingMessages(true);
      const res = await axios.get(`/api/v1/leads/${leadId}`);
      const rawMessages: MessageItem[] = res.data.messages || [];
      const whatsappMessages = rawMessages.filter(
        (m) => m.channel === "WHATSAPP" || m.channel === "SYSTEM_NOTE"
      );

      setMessages((prev) => {
        // Compare message IDs to prevent unnecessary state updates & re-renders
        if (
          prev.length !== whatsappMessages.length ||
          (prev.length > 0 &&
            whatsappMessages.length > 0 &&
            prev[prev.length - 1]._id !== whatsappMessages[whatsappMessages.length - 1]._id)
        ) {
          return whatsappMessages;
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    } finally {
      if (!isSilent) setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Silent Auto-Polling for Live 2-Way Chat Inbound Updates (Zero Flickering!)
  useEffect(() => {
    if (!selectedLead) return;

    fetchConversation(selectedLead._id, false);

    const interval = setInterval(() => {
      fetchConversation(selectedLead._id, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedLead, fetchConversation]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedLead) return;

    const messageText = inputText;
    setInputText("");

    try {
      setIsSending(true);
      await axios.post("/api/v1/whatsapp/send", {
        leadId: selectedLead._id,
        recipientPhone: selectedLead.phone,
        messageType: "text",
        content: messageText,
      });

      // Refresh chat thread
      fetchConversation(selectedLead._id);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Select HSM Template
  const handleInsertTemplate = async (
    template: HsmTemplate,
    compiledText: string,
    params: string[]
  ) => {
    if (!selectedLead) return;

    try {
      setIsSending(true);
      await axios.post("/api/v1/whatsapp/send", {
        leadId: selectedLead._id,
        recipientPhone: selectedLead.phone,
        messageType: "template",
        content: compiledText,
        templateName: template.name,
        templateParams: params,
      });

      fetchConversation(selectedLead._id);
    } catch (err) {
      console.error("Failed to send template message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Filter leads by search query
  const filteredLeads = leads.filter(
    (l) =>
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phone.includes(searchQuery) ||
      l.leadCustomId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.companyName &&
        l.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex gap-5 h-[calc(100vh-var(--header-height)-52px)] overflow-hidden">
      {/* Left Sidebar: Contact Conversations List */}
      <div
        className="w-80 sm:w-96 shrink-0 bg-white rounded-2xl border border-slate-300 flex flex-col shadow-xs overflow-hidden"
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Conversations
            </h2>
            <button
              onClick={fetchLeads}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Refresh Conversations"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingLeads ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:border-(--color-brand-green) outline-none transition-all"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredLeads.length === 0 ? (
            <div className="p-8 text-center text-xs font-semibold text-slate-500">
              No matching contacts found.
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const isSelected = selectedLead?._id === lead._id;
              return (
                <div
                  key={lead._id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-(--color-brand-green-light)/40 border-l-4 border-l-(--color-brand-green)"
                      : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs mt-0.5"
                    style={{ backgroundColor: "var(--color-brand-green)" }}
                  >
                    {lead.fullName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {lead.fullName}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {lead.leadCustomId}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-600 truncate">
                      {lead.companyName || lead.phone}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-slate-500 truncate">
                        {lead.phone}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel: Active Conversation Window */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-300 flex flex-col shadow-xs overflow-hidden">
        {selectedLead ? (
          <>
            {/* Conversation Header Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xs"
                  style={{ backgroundColor: "var(--color-brand-green)" }}
                >
                  {selectedLead.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedLead.fullName}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {selectedLead.leadCustomId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedLead.phone}
                    </span>
                    {selectedLead.companyName && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        {selectedLead.companyName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Meta HSM Templates
                </button>
              </div>
            </div>

            {/* Messages Thread Window */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-100/40">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full text-xs font-semibold text-slate-500">
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="w-10 h-10 text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    No messages yet with {selectedLead.fullName}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Send a message or verified Meta template below to initiate conversation.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${
                        isOutbound ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          isOutbound
                            ? "bg-emerald-50 border border-emerald-200 text-slate-900 rounded-br-xs"
                            : "bg-white border border-slate-300 text-slate-900 rounded-bl-xs"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500 mb-1.5 pb-1 border-b border-slate-200/60">
                          <span>
                            {msg.senderInfo?.name ||
                              (isOutbound ? "Agent" : selectedLead.fullName)}
                          </span>
                          <span>
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </span>
                        </div>

                        {/* Media Attachment Previews */}
                        {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                          <div className="mt-2 mb-1">
                            {msg.mediaType === "image" || msg.content.includes("image") ? (
                              <a
                                href={
                                  msg.mediaUrls[0].includes("lookaside") || msg.mediaUrls[0].includes("facebook")
                                    ? `/api/v1/whatsapp/media-proxy?url=${encodeURIComponent(msg.mediaUrls[0])}`
                                    : msg.mediaUrls[0]
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="block group relative rounded-xl overflow-hidden border border-slate-200 shadow-2xs"
                              >
                                <img
                                  src={
                                    msg.mediaUrls[0].includes("lookaside") || msg.mediaUrls[0].includes("facebook")
                                      ? `/api/v1/whatsapp/media-proxy?url=${encodeURIComponent(msg.mediaUrls[0])}`
                                      : msg.mediaUrls[0]
                                  }
                                  alt="Attachment"
                                  className="max-h-60 w-auto object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                                  <ExternalLink className="w-4 h-4" /> View Full Image
                                </div>
                              </a>
                            ) : (
                              <a
                                href={
                                  msg.mediaUrls[0].includes("lookaside") || msg.mediaUrls[0].includes("facebook")
                                    ? `/api/v1/whatsapp/media-proxy?url=${encodeURIComponent(msg.mediaUrls[0])}`
                                    : msg.mediaUrls[0]
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/90 border border-slate-300 hover:bg-slate-200/80 transition-colors group"
                              >
                                <div className="p-2 rounded-lg bg-emerald-600 text-white font-bold">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700">
                                    Document Attachment
                                  </p>
                                  <p className="text-[10px] font-semibold text-slate-500">
                                    Click to download / view file
                                  </p>
                                </div>
                                <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Inbound Attachment Badge if content has [Attachment: ...] */}
                        {msg.content.includes("[Attachment:") && (!msg.mediaUrls || msg.mediaUrls.length === 0) && (
                          <div className="mt-1.5 p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                            <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{msg.content}</span>
                          </div>
                        )}

                        {!msg.content.includes("[Attachment:") && (
                          <p className="font-medium whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}

                        {/* Outbound Status Indicator */}
                        {isOutbound && (
                          <div className="flex justify-end mt-1.5">
                            {msg.status === "READ" ? (
                              <span title="Read">
                                <CheckCheck className="w-4 h-4 text-blue-600" />
                              </span>
                            ) : msg.status === "DELIVERED" ? (
                              <span title="Delivered">
                                <CheckCheck className="w-4 h-4 text-slate-400" />
                              </span>
                            ) : (
                              <span title="Sent">
                                <Check className="w-4 h-4 text-slate-400" />
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
            >
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(true)}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Insert Verified Meta HSM Template"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                type="button"
                onClick={() => setIsAttachmentModalOpen(true)}
                className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                title="Send File Attachment (PDF Brochure / Image)"
              >
                <Paperclip className="w-4 h-4 text-blue-600" />
              </button>

              <input
                type="text"
                placeholder={`Type WhatsApp message for ${selectedLead.fullName}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) outline-none transition-all"
              />

              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 hover:bg-emerald-700"
                style={{ backgroundColor: "var(--color-status-success)" }}
              >
                <Send className="w-4 h-4" /> Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-12 h-12 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              WhatsApp Omnichannel Center
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1 max-w-sm">
              Select a contact conversation from the left list to view thread history or send WhatsApp messages.
            </p>
          </div>
        )}
      </div>

      {/* HSM Template Picker Modal */}
      {selectedLead && (
        <HsmTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          leadName={selectedLead.fullName}
          onSelectTemplate={(template, compiledText, params) => {
            setIsTemplateModalOpen(false);
            axios
              .post("/api/v1/whatsapp/send", {
                leadId: selectedLead._id,
                recipientPhone: selectedLead.phone,
                messageType: "template",
                content: compiledText,
                templateName: template.name,
                templateParams: params,
              })
              .then(() => {
                fetchConversation(selectedLead._id, true);
              })
              .catch((err) => {
                console.error("Failed to dispatch HSM template:", err);
              });
          }}
        />
      )}

      {/* Media Attachment Modal */}
      {selectedLead && (
        <SendAttachmentModal
          isOpen={isAttachmentModalOpen}
          onClose={() => setIsAttachmentModalOpen(false)}
          leadId={selectedLead._id}
          recipientPhone={selectedLead.phone}
          recipientName={selectedLead.fullName}
          onAttachmentSent={() => {
            fetchConversation(selectedLead._id, true);
          }}
        />
      )}
    </div>
  );
}
