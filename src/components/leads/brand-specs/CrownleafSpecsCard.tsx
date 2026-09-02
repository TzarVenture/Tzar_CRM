"use client";

import React from "react";
import { Gift, Building2, DollarSign, PackageCheck, Users, Tag } from "lucide-react";
import { ILead } from "@/models/Lead";

interface CrownleafSpecsCardProps {
  lead: Partial<ILead>;
}

export function CrownleafSpecsCard({ lead }: CrownleafSpecsCardProps) {
  const data = lead.crownleafData;

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-white p-5 rounded-2xl border border-amber-200 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-700" /> Crownleaf Corporate & Luxury Gifting Scope
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          Luxury Gifting
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* Gifting Occasion */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Gifting Occasion
          </p>
          <p className="font-extrabold text-slate-900 text-sm break-words">
            {data?.giftingOccasion || data?.giftingCategory || "Corporate Festive Hampers"}
          </p>
        </div>

        {/* Expected Quantity */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Expected Box Quantity
          </p>
          <p className="font-extrabold text-amber-800 text-sm break-words">
            {data?.boxQuantity || (data?.quantityUnits ? `${data.quantityUnits} Boxes` : "Not Specified")}
          </p>
        </div>

        {/* Budget Per Hamper */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Budget Per Hamper
          </p>
          <p className="font-extrabold text-emerald-700 text-sm break-words">
            {data?.budgetPerBox || "Not Specified"}
          </p>
        </div>

        {/* Recipient Profile */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Recipient Profile
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.recipientType || "Corporate Employees / Clients"}
          </p>
        </div>

        {/* Corporate Client Organization */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Organization Name
          </p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {lead.companyName || "Corporate Account"}
          </p>
        </div>

        {/* Custom Branding */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-amber-100 space-y-1">
          <p className="text-slate-500 font-medium">Custom Branding / Packaging</p>
          <p className="font-bold text-slate-800 text-xs break-words">
            {data?.customBranding || "Bespoke Packaging & Ribbon"}
          </p>
        </div>
      </div>
    </div>
  );
}
