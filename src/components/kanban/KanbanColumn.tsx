"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanCard, { KanbanLeadData } from "./KanbanCard";

interface KanbanColumnProps {
  stageId: string;
  stageName: string;
  leads: KanbanLeadData[];
}

export default function KanbanColumn({
  stageId,
  stageName,
  leads,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  const totalValue = leads.reduce(
    (sum, lead) => sum + (lead.estimatedBudget || 0),
    0
  );

  const getStageHeaderColor = (id: string) => {
    switch (id) {
      case "closed-won":
        return "border-t-4 border-t-emerald-600";
      case "closed-lost":
        return "border-t-4 border-t-red-500";
      case "proposal-sent":
      case "negotiation":
        return "border-t-4 border-t-amber-500";
      default:
        return "border-t-4 border-t-(--color-brand-green)";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`shrink-0 w-80 flex flex-col bg-slate-200/50 rounded-2xl border transition-colors ${
        getStageHeaderColor(stageId)
      } ${
        isOver
          ? "border-(--color-brand-green) bg-(--color-brand-green-light)/40"
          : "border-slate-300"
      }`}
      style={{ maxHeight: "calc(100vh - var(--header-height) - 140px)" }}
    >
      {/* Column Header */}
      <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-300 bg-slate-100/60 rounded-t-xl">
        <div className="flex items-center gap-2.5">
          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {stageName}
          </h3>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-white border border-slate-300 text-slate-700 shadow-2xs">
            {leads.length}
          </span>
        </div>

        {totalValue > 0 && (
          <span className="text-xs font-extrabold text-(--color-brand-green)">
            ${totalValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Cards Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[160px]">
        <SortableContext
          items={leads.map((l) => l._id)}
          strategy={verticalListSortingStrategy}
        >
          {leads.map((lead) => (
            <KanbanCard key={lead._id} lead={lead} />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-400">
              Drop leads here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
