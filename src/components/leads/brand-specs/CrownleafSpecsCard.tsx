"use client";

import React from "react";
import { Gift, Buildings as Building2, CurrencyDollar as DollarSign, Package as PackageCheck, Users, Tag } from "@phosphor-icons/react";
import { ILead } from "@/models/Lead";

interface CrownleafSpecsCardProps {
  lead: Partial<ILead>;
}

export function CrownleafSpecsCard({ lead }: CrownleafSpecsCardProps) {
  const data = lead.crownleafData;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Gift className="w-4 h-4 text-foreground" /> Crownleaf Corporate & Luxury Gifting Scope
        </h3>
        <span className="text-sm text-muted-foreground">
          Luxury Gifting
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {/* Gifting Occasion */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Gifting Occasion
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.giftingOccasion || data?.giftingCategory || "Corporate Festive Hampers"}
          </p>
        </div>

        {/* Expected Quantity */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <PackageCheck className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Expected Box Quantity
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.boxQuantity || (data?.quantityUnits ? `${data.quantityUnits} Boxes` : "Not Specified")}
          </p>
        </div>

        {/* Budget Per Hamper */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Budget Per Hamper
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.budgetPerBox || "Not Specified"}
          </p>
        </div>

        {/* Recipient Profile */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Recipient Profile
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.recipientType || "Corporate Employees / Clients"}
          </p>
        </div>

        {/* Corporate Client Organization */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Organization Name
          </p>
          <p className="font-semibold text-foreground text-sm break-words">
            {lead.companyName || "Corporate Account"}
          </p>
        </div>

        {/* Custom Branding */}
        <div className="bg-muted p-3.5 rounded-lg border border-border space-y-1">
          <p className="text-muted-foreground font-medium">Custom Branding / Packaging</p>
          <p className="font-semibold text-foreground text-sm break-words">
            {data?.customBranding || "Bespoke Packaging & Ribbon"}
          </p>
        </div>
      </div>
    </div>
  );
}
