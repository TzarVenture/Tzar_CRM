"use client";

import { formatINR } from "@/lib/invoice/calc";

export const BRAND_LABEL: Record<string, string> = {
  tzar: "Tzar Digital Agency",
  adshalaa: "Adshalaa Edutech",
  crownleaf: "Crownleaf",
  titepo: "Titepo",
  general: "General",
};

export const cardClass = "bg-card border border-border rounded-2xl shadow-xs";
export const selectClass =
  "px-3 py-2.5 text-sm font-medium rounded-xl border border-input bg-card outline-none focus:border-ring";

export function Money({ value, className = "" }: { value: number; className?: string }) {
  return <span className={`tabular-nums ${className}`}>₹{formatINR(value)}</span>;
}

/** Financial years offered in period pickers: the current one and the previous two. */
export function financialYearOptions(): { value: string; label: string }[] {
  const now = new Date();
  const current = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return [current, current - 1, current - 2].map((y) => ({
    value: `fy:${y}`,
    label: `FY ${y}-${String(y + 1).slice(2)}`,
  }));
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string } } };
  return e?.response?.data?.error || fallback;
}
