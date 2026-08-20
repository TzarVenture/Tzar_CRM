"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { MessageCircle, Mail, Clock, DollarSign, Tag, Award, Building } from "lucide-react";
import { formatDistanceToNow, isAfter } from "date-fns";

export interface KanbanLeadData {
  _id: string;
  leadCustomId: string;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  interestedServices: string[];
  estimatedBudget?: number;
  score: number;
  stageId: string;
  slaDeadline?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

interface KanbanCardProps {
  lead: KanbanLeadData;
}

export default function KanbanCard({ lead }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const isSlaBreached = lead.slaDeadline
    ? isAfter(new Date(), new Date(lead.slaDeadline))
    : false;

  const slaFormatted = lead.slaDeadline
    ? formatDistanceToNow(new Date(lead.slaDeadline), { addSuffix: true })
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative bg-white rounded-xl p-4 border border-slate-300 hover:border-(--color-brand-green) shadow-xs hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing"
    >
      {/* Top Bar: Custom ID + Score Badge */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
          {lead.leadCustomId}
        </span>

        {/* Lead Score */}
        <span
          className="flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300"
          style={{
            backgroundColor: "var(--color-brand-mustard-bg)",
            color: "var(--color-brand-mustard)",
          }}
          title="Lead Score"
        >
          <Award className="w-3.5 h-3.5" />
          {lead.score} pts
        </span>
      </div>

      {/* Lead Name & Company */}
      <div className="mb-3">
        <Link
          href={`/leads/${lead._id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-bold text-slate-900 hover:text-(--color-brand-green) transition-colors line-clamp-1"
        >
          {lead.fullName}
        </Link>
        {lead.companyName && (
          <p className="text-xs font-semibold text-slate-600 truncate mt-0.5 flex items-center gap-1">
            <Building className="w-3 h-3 text-slate-400 shrink-0" />
            {lead.companyName}
          </p>
        )}
      </div>

      {/* Service Badges */}
      {lead.interestedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {lead.interestedServices.slice(0, 2).map((srv) => (
            <span
              key={srv}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-(--color-brand-green-light) text-(--color-brand-green)"
            >
              <Tag className="w-3 h-3" />
              {srv.replace("-", " ")}
            </span>
          ))}
          {lead.interestedServices.length > 2 && (
            <span className="text-xs font-bold text-slate-500 self-center">
              +{lead.interestedServices.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Card Footer: Budget + SLA + Quick Actions */}
      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
        {/* Budget */}
        {lead.estimatedBudget ? (
          <span className="flex items-center gap-0.5 font-bold text-slate-900">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            {lead.estimatedBudget.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium">No Budget</span>
        )}

        {/* SLA Status */}
        {slaFormatted && (
          <span
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md border ${
              isSlaBreached
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
            title={isSlaBreached ? "SLA Overdue!" : "SLA Target"}
          >
            <Clock className="w-3.5 h-3.5" />
            {isSlaBreached ? "Overdue" : slaFormatted}
          </span>
        )}

        {/* Quick Action Icons & Avatar */}
        <div className="flex items-center gap-1.5 ml-auto">
          <a
            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
            title="WhatsApp Chat"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
            title="Send Email"
          >
            <Mail className="w-4 h-4" />
          </a>

          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-xs"
            style={{ backgroundColor: "var(--color-brand-green)" }}
            title={`Assigned to: ${lead.assignedTo?.name || "Unassigned"}`}
          >
            {lead.assignedTo?.name?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </div>
  );
}
