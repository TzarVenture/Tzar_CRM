"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ShoppingBag,
  Briefcase,
  BookOpen,
  Gift,
  ExternalLink,
} from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

interface RecentLeadItem {
  id: string;
  customId: string;
  name: string;
  email: string;
  phone: string;
  business: BusinessSlug;
  stageName: string;
  stageId: string;
  serviceOrProduct: string;
  qty: string;
  value: number;
  createdAt: string;
}

interface RecentActivityTableProps {
  leads: RecentLeadItem[];
  onOpenCreateModal?: () => void;
}

export function RecentActivityTable({ leads, onOpenCreateModal }: RecentActivityTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = leads.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.customId.toLowerCase().includes(q) ||
      l.serviceOrProduct.toLowerCase().includes(q) ||
      l.business.toLowerCase().includes(q)
    );
  });

  const getStagePill = (stageId: string, stageName: string) => {
    if (stageId === "closed-won") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Won
        </span>
      );
    }
    if (stageId === "proposal-sent" || stageId === "negotiation") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {stageName}
        </span>
      );
    }
    if (stageId === "discovery-call" || stageId === "contacted") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          {stageName}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        New Lead
      </span>
    );
  };

  const getBrandBadge = (business: BusinessSlug) => {
    if (business === "titepo") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/titepo-logo.png" alt="Titepo" className="h-3.5 w-auto max-w-[48px] object-contain shrink-0" />
        </span>
      );
    }
    if (business === "crownleaf") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Crownleaf-logo.png" alt="Crownleaf" className="h-3.5 w-auto max-w-[48px] object-contain shrink-0" />
        </span>
      );
    }
    if (business === "adshalaa") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-200/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/adshalaa-logo.png" alt="Adshalaa" className="h-3.5 w-auto max-w-[48px] object-contain shrink-0" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/tzar-logo.png" alt="Tzar" className="h-3.5 w-auto max-w-[48px] object-contain shrink-0" />
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden space-y-4 p-5">
      {/* Table Header Controls (BagUI Structure) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Recent Inquiries & Deal Flow</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time pipeline transactions across all brands</p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads, ID, service..."
              className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-slate-900 outline-none w-48 sm:w-64 transition-all"
            />
          </div>

          {/* Add Lead CTA */}
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 1. MOBILE CARD LIST (Visible on < md screens) ────────────────── */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400">
            No matching inquiries found.
          </div>
        ) : (
          filtered.slice(0, 10).map((item) => (
            <Link
              key={item.id}
              href={`/pipeline/${item.id}`}
              className="block p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 hover:bg-slate-100/60 transition-all space-y-2"
            >
              {/* Top Row: Custom ID + Brand Logo + Stage Pill */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[11px] text-slate-700">
                    {item.customId}
                  </span>
                  {getBrandBadge(item.business)}
                </div>
                {getStagePill(item.stageId, item.stageName)}
              </div>

              {/* Middle Row: Customer Name & Inquired Service */}
              <div>
                <p className="font-black text-xs text-slate-900 leading-snug">{item.name}</p>
                <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                  {item.serviceOrProduct} • {item.qty || "1 Unit"}
                </p>
              </div>

              {/* Bottom Row: Value & Arrow */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                <span className="font-black text-slate-900">
                  {item.value > 0 ? `₹${item.value.toLocaleString("en-IN")}` : "Value unassigned"}
                </span>
                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-0.5">
                  Workspace <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* ─── 2. DESKTOP HIGH-DENSITY TABLE (Visible on md+ screens) ─────────── */}
      <div className="hidden md:block overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-4">Lead ID</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Brand / Product</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Scope / Qty</th>
              <th className="py-2.5 px-4 text-right">Est. Value</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                  No matching inquiries found.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 10).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                  {/* Lead ID */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">
                    <Link
                      href={`/pipeline/${item.id}`}
                      className="hover:text-emerald-700 hover:underline"
                    >
                      {item.customId}
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <p className="font-extrabold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.phone || item.email}</p>
                  </td>

                  {/* Brand & Service */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getBrandBadge(item.business)}
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                        {item.serviceOrProduct}
                      </span>
                    </div>
                  </td>

                  {/* Stage Status */}
                  <td className="py-3 px-4">
                    {getStagePill(item.stageId, item.stageName)}
                  </td>

                  {/* Qty / Scope */}
                  <td className="py-3 px-4 font-semibold text-slate-600">
                    {item.qty || "1 Unit"}
                  </td>

                  {/* Estimated Value */}
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {item.value > 0 ? `₹${item.value.toLocaleString("en-IN")}` : "—"}
                  </td>

                  {/* Action Link */}
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/pipeline/${item.id}`}
                      className="p-1.5 inline-flex rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Open Lead 360 Workspace"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
