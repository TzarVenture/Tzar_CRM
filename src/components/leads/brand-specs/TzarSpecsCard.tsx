"use client";

import React from "react";
import { Briefcase, Globe, DollarSign, Clock, Building2, Laptop } from "lucide-react";
import { ILead } from "@/models/Lead";

interface TzarSpecsCardProps {
  lead: Partial<ILead>;
}

export function TzarSpecsCard({ lead }: TzarSpecsCardProps) {
  const data = lead.tzarData;

  return (
    <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white p-5 rounded-2xl border border-emerald-200 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-emerald-700" /> Tzar Agency Service & Project Scope
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          Digital Marketing & WebDev
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* Required Service */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Required Service
          </p>
          <p className="font-extrabold text-slate-900 text-sm break-words">
            {data?.serviceNeeded || lead.interestedServices?.[0] || "Not Specified"}
          </p>
        </div>

        {/* Project Budget */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Investment Budget
          </p>
          <p className="font-extrabold text-emerald-700 text-sm break-words">
            {data?.budget || (lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : "Not Specified")}
          </p>
        </div>

        {/* Start Timeline */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Start Timeline
          </p>
          <p className="font-extrabold text-slate-900 text-sm break-words">
            {data?.timeline || "Not Specified"}
          </p>
        </div>

        {/* Existing Website */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Existing Website
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.hasWebsite || data?.domain || "Not Specified"}
          </p>
        </div>

        {/* Company Stage */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Company Stage
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.companyType || "Not Specified"}
          </p>
        </div>

        {/* Organization Name */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-emerald-100 space-y-1">
          <p className="text-slate-500 font-medium">Business / Brand Name</p>
          <p className="font-extrabold text-slate-900 text-xs break-words">
            {data?.companyName || lead.companyName || "Not Specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
