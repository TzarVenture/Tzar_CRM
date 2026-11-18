"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { SpinnerGap as Loader2, TrendUp as TrendingUp, TrendDown as TrendingDown, Bank as Landmark, Hourglass, HandCoins, Scales as Scale } from "@phosphor-icons/react";
import type { Overview } from "@/lib/accounts/overview";
import { BRAND_LABEL, Money, cardClass, errorMessage, financialYearOptions, selectClass } from "./shared";

function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return new Date(y, mo - 1, 1).toLocaleString("en-IN", { month: "short", year: "2-digit" });
}

export default function AccountsOverview() {
  const years = financialYearOptions();
  const [period, setPeriod] = useState(years[0].value);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`/api/v1/accounts/overview?period=${encodeURIComponent(period)}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data.overview);
        setError(null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Could not load the overview")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [period]);

  const maxBar = Math.max(1, ...(data?.monthly.flatMap((m) => [m.earned, m.spent]) ?? [1]));

  const tiles = data
    ? [
        { label: "Earned (before GST)", value: data.earned, icon: TrendingUp, tone: "text-success bg-success-soft", note: `${data.invoiceCount} tax invoices` },
        { label: "Spent", value: data.spent, icon: TrendingDown, tone: "text-destructive bg-destructive-soft", note: `${data.expenseCount} expense entries` },
        { label: "Profit", value: data.profit, icon: Scale, tone: data.profit >= 0 ? "text-foreground bg-muted" : "text-destructive bg-destructive-soft", note: "Earned minus spent" },
        { label: "GST to pay", value: data.gstPayable, icon: Landmark, tone: "text-warning bg-warning-soft", note: `Collected ${data.gstCollected.toFixed(0)} less credit ${data.itcAvailable.toFixed(0)}` },
        { label: "Received", value: data.received, icon: HandCoins, tone: "text-info bg-info-soft", note: "Against these invoices" },
        { label: "Still to collect", value: data.outstanding, icon: Hourglass, tone: "text-foreground bg-muted", note: "Unpaid invoice balance" },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="period" className="text-sm font-semibold text-foreground">
          Period
        </label>
        <select id="period" value={period} onChange={(e) => { setLoading(true); setPeriod(e.target.value); }} className={selectClass}>
          {years.map((y) => (
            <option key={y.value} value={y.value}>{y.label}</option>
          ))}
          <option value="all">All time</option>
        </select>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {error && <div className="p-3 text-sm font-semibold text-destructive bg-destructive-soft border border-border rounded-xl">{error}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {tiles.map((t) => (
              <div key={t.label} className={`${cardClass} p-4`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <span className={`p-1.5 rounded-lg ${t.tone}`}><t.icon className="w-4 h-4" /></span>
                  {t.label}
                </div>
                <div className="mt-2 text-2xl font-bold text-foreground"><Money value={t.value} /></div>
                <div className="text-sm text-muted-foreground mt-0.5">{t.note}</div>
              </div>
            ))}
          </div>

          <div className={`${cardClass} p-4`}>
            <h2 className="text-base font-bold text-foreground">Earned vs spent, month by month</h2>
            {data.monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No invoices or expenses in this period yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.monthly.map((m) => (
                  <li key={m.month} className="grid grid-cols-[4.5rem_1fr] sm:grid-cols-[4.5rem_1fr_11rem] items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{monthLabel(m.month)}</span>
                    <div className="space-y-1">
                      <div className="h-2.5 rounded-full bg-primary" style={{ width: `${(m.earned / maxBar) * 100}%` }} role="img" aria-label={`Earned ${m.earned}`} />
                      <div className="h-2.5 rounded-full bg-destructive" style={{ width: `${(m.spent / maxBar) * 100}%` }} role="img" aria-label={`Spent ${m.spent}`} />
                    </div>
                    <span className="hidden sm:block text-sm text-foreground tabular-nums">
                      <span className="text-success font-semibold">₹{m.earned.toLocaleString("en-IN")}</span>
                      {" / "}
                      <span className="text-destructive font-semibold">₹{m.spent.toLocaleString("en-IN")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full bg-primary" /> Earned</span>
              <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-full bg-destructive" /> Spent</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-3">
            <Table title="By brand" head={["Brand", "Earned", "Spent"]} rows={data.byBrand.map((b) => [BRAND_LABEL[b.brand] || b.brand, b.earned, b.spent])} />
            <Table title="Spend by category" head={["Category", "Amount"]} rows={data.byCategory.map((c) => [c.category, c.amount])} />
            <Table title="Who owes you most" head={["Customer", "Due"]} rows={data.topDebtors.map((d) => [d.name, d.outstanding])} />
          </div>
        </>
      )}
    </div>
  );
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className={`${cardClass} p-4`}>
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">Nothing yet.</p>
      ) : (
        <table className="w-full mt-2 text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              {head.map((h, i) => (
                <th key={h} className={`py-1.5 font-semibold ${i > 0 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t border-border">
                {r.map((c, i) => (
                  <td key={i} className={`py-1.5 ${i > 0 ? "text-right tabular-nums font-medium" : "font-medium text-foreground"}`}>
                    {typeof c === "number" ? <Money value={c} /> : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
