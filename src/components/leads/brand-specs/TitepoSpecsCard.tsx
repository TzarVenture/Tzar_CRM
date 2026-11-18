"use client";

import React from "react";
import { ShoppingBag, CalendarBlank as Calendar, CurrencyDollar as DollarSign, Users, MapPin, Sparkle as Sparkles } from "@phosphor-icons/react";
import { ILead } from "@/models/Lead";

interface TitepoSpecsCardProps {
  lead: Partial<ILead>;
}

export function TitepoSpecsCard({ lead }: TitepoSpecsCardProps) {
  const data = lead.titepoData;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-foreground" /> Titepo Event & Return Gift Specifications
        </h3>
        <span className="text-sm text-muted-foreground">
          Toys & Return Gifts
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Occasion */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Occasion / Event</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.eventType || "Not Specified"}
          </p>
        </div>

        {/* Quantity */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Return Gifts Quantity</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.kidsCount || "Not Specified"}
          </p>
        </div>

        {/* Budget Per Gift */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Budget Per Gift</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.budgetPerGift || "Not Specified"}
          </p>
        </div>

        {/* Age Group */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Child Age Group</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.childAgeGroup || "Not Specified"}
          </p>
        </div>

        {/* Event Date */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Event Date
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.eventDate || "Not Specified"}
          </p>
        </div>

        {/* Delivery / Address */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1 sm:col-span-2 md:col-span-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Location / Delivery Address
          </p>
          <p className="font-semibold text-foreground text-sm break-words leading-relaxed">
            {data?.streetAddress || lead.city || "Not Specified"}
          </p>
        </div>
      </div>

      {/* Special Requirements */}
      {data?.specialRequirements && (
        <div className="bg-muted p-3.5 rounded-lg border border-border flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
          <div className="text-sm min-w-0 flex-1">
            <p className="font-semibold text-foreground">Special Customization & Requirements:</p>
            <p className="text-foreground font-medium mt-0.5 break-words leading-relaxed">{data.specialRequirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}
