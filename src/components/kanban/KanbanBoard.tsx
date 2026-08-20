"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import axios from "axios";
import { Search, Plus, RefreshCw, Filter, DollarSign } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import KanbanCard, { KanbanLeadData } from "./KanbanCard";
import AddLeadModal from "./AddLeadModal";

export const STAGES = [
  { id: "new-lead", name: "New Lead" },
  { id: "contacted", name: "Contacted" },
  { id: "discovery-call", name: "Discovery Call" },
  { id: "proposal-sent", name: "Proposal Sent" },
  { id: "negotiation", name: "Negotiation" },
  { id: "closed-won", name: "Closed Won" },
  { id: "closed-lost", name: "Closed Lost" },
];

export default function KanbanBoard() {
  const [leads, setLeads] = useState<KanbanLeadData[]>([]);
  const [activeLead, setActiveLead] = useState<KanbanLeadData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedService) params.service = selectedService;

      const res = await axios.get("/api/v1/leads", { params });
      setLeads(res.data.leads || []);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedService]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l._id === active.id);
    if (lead) {
      setActiveLead(lead);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStageId = over.id as string;

    const targetStage = STAGES.some((s) => s.id === newStageId)
      ? newStageId
      : leads.find((l) => l._id === newStageId)?.stageId;

    if (!targetStage) return;

    const lead = leads.find((l) => l._id === leadId);
    if (!lead || lead.stageId === targetStage) return;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l._id === leadId ? { ...l, stageId: targetStage } : l))
    );

    try {
      await axios.patch(`/api/v1/leads/${leadId}/stage`, {
        stageId: targetStage,
      });
    } catch (error) {
      console.error("Failed to update lead stage:", error);
      fetchLeads();
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stageId === stageId);
  };

  const totalPipelineValue = leads.reduce(
    (sum, lead) => sum + (lead.estimatedBudget || 0),
    0
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Controls Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-300"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Search & Service Filter */}
        <div className="flex items-center gap-3 flex-1 min-w-[320px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads, company, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-(--color-brand-green) outline-none transition-all"
            />
          </div>

          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="pl-8 pr-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-700 outline-none cursor-pointer hover:border-slate-400 transition-colors"
            >
              <option value="">All Services</option>
              <option value="website-development">Website Development</option>
              <option value="searchengineoptimization">SEO Retainers</option>
              <option value="ppc-digital-marketing">PPC & Meta Ads</option>
              <option value="branding-creative">Branding & Creative</option>
            </select>
          </div>

          <button
            onClick={fetchLeads}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Pipeline"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Metrics Summary & CTA */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <span className="text-slate-600">Total Pipeline Value:</span>
            <span className="font-extrabold text-(--color-brand-green) flex items-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              {totalPipelineValue.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer hover:bg-(--color-brand-green-hover)"
            style={{ backgroundColor: "var(--color-brand-green)" }}
          >
            <Plus className="w-4 h-4" />
            Add Manual Lead
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 flex-1 min-h-[520px]">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stageId={stage.id}
              stageName={stage.name}
              leads={getLeadsByStage(stage.id)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <KanbanCard lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadAdded={fetchLeads}
      />
    </div>
  );
}
