"use client";

import React from "react";
import { ShoppingBag, Calendar, DollarSign, Users, MapPin, Sparkles } from "lucide-react";
import { ILead } from "@/models/Lead";

interface TitepoSpecsCardProps {
  lead: Partial<ILead>;
}

export function TitepoSpecsCard({ lead }: TitepoSpecsCardProps) {
  const data = lead.titepoData;

  return (
    <div className="bg-gradient-to-br from-pink-50/70 via-rose-50/40 to-white p-5 rounded-2xl border border-pink-200 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 border-b border-pink-200/80">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-pink-950 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-pink-600" /> Titepo Event & Return Gift Specifications
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
          Toys & Return Gifts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* Occasion */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1">
          <p className="text-slate-500 font-medium">Occasion / Event</p>
          <p className="font-extrabold text-slate-900 text-sm break-words">
            {data?.eventType || "Not Specified"}
          </p>
        </div>

        {/* Quantity */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1">
          <p className="text-slate-500 font-medium">Return Gifts Quantity</p>
          <p className="font-extrabold text-pink-700 text-sm break-words">
            {data?.kidsCount || "Not Specified"}
          </p>
        </div>

        {/* Budget Per Gift */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1">
          <p className="text-slate-500 font-medium">Budget Per Gift</p>
          <p className="font-extrabold text-emerald-700 text-sm break-words">
            {data?.budgetPerGift || "Not Specified"}
          </p>
        </div>

        {/* Age Group */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1">
          <p className="text-slate-500 font-medium">Child Age Group</p>
          <p className="font-extrabold text-purple-700 text-sm break-words">
            {data?.childAgeGroup || "Not Specified"}
          </p>
        </div>

        {/* Event Date */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Event Date
          </p>
          <p className="font-extrabold text-slate-900 text-sm break-words">
            {data?.eventDate || "Not Specified"}
          </p>
        </div>

        {/* Delivery / Address */}
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-100 space-y-1 sm:col-span-2 md:col-span-1">
          <p className="text-slate-500 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Location / Delivery Address
          </p>
          <p className="font-bold text-slate-800 text-xs break-words leading-relaxed">
            {data?.streetAddress || lead.city || "Not Specified"}
          </p>
        </div>
      </div>

      {/* Special Requirements */}
      {data?.specialRequirements && (
        <div className="bg-white/90 p-3.5 rounded-xl border border-pink-200/90 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
          <div className="text-xs min-w-0 flex-1">
            <p className="font-bold text-pink-900">Special Customization & Requirements:</p>
            <p className="text-slate-700 font-medium mt-0.5 break-words leading-relaxed">{data.specialRequirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
