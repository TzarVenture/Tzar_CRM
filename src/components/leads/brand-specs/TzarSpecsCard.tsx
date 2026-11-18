"use client";

import React from "react";
import { Briefcase, Globe, CurrencyDollar as DollarSign, Clock, Buildings as Building2, Laptop } from "@phosphor-icons/react";
import { ILead } from "@/models/Lead";

interface TzarSpecsCardProps {
  lead: Partial<ILead>;
}

export function TzarSpecsCard({ lead }: TzarSpecsCardProps) {
  const data = lead.tzarData;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-foreground" /> Tzar Agency Service & Project Scope
        </h3>
        <span className="text-sm text-muted-foreground">
          Digital Marketing & WebDev
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Required Service */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Required Service
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.serviceNeeded || lead.interestedServices?.[0] || "Not Specified"}
          </p>
        </div>

        {/* Project Budget */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Investment Budget
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.budget || (lead.estimatedBudget ? `₹${lead.estimatedBudget.toLocaleString()}` : "Not Specified")}
          </p>
        </div>

        {/* Start Timeline */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Start Timeline
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.timeline || "Not Specified"}
          </p>
        </div>

        {/* Existing Website */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Existing Website
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.hasWebsite || data?.domain || "Not Specified"}
          </p>
        </div>

        {/* Company Stage */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Company Stage
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.companyType || "Not Specified"}
          </p>
        </div>

        {/* Organization Name */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Business / Brand Name</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.companyName || lead.companyName || "Not Specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
