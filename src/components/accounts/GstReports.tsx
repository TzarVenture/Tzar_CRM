"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Warning as AlertTriangle, DownloadSimple as Download, FileCode as FileCode2, SpinnerGap as Loader2 } from "@phosphor-icons/react";
import type { Gstr1, Gstr3b } from "@/lib/accounts/gst";
import { INDIAN_STATES } from "@/lib/invoice/config";
import { Money, cardClass, errorMessage, financialYearOptions, selectClass } from "./shared";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const stateName = (code: string) => INDIAN_STATES.find((s) => s.code === code)?.name || code;

type Sheet = "b2b" | "b2cl" | "b2cs" | "hsn";

export default function GstReports() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<{ gstr1: Gstr1; gstr3b: Gstr3b } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tallyPeriod, setTallyPeriod] = useState("all");
  const years = financialYearOptions();

  useEffect(() => {
    if (!month) return;
    let cancelled = false;
    axios
      .get(`/api/v1/accounts/gst?month=${month}`)
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setError(null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err, "Could not build the report")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const csv = (name: string) => `/api/v1/accounts/gst?month=${month}&csv=${name}`;
  const g1 = data?.gstr1;
  const g3 = data?.gstr3b;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="month" className="text-sm font-semibold text-foreground">Return month</label>
        <input id="month" type="month" value={month} onChange={(e) => { setLoading(true); setMonth(e.target.value); }} className={selectClass} />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {error && <div className="p-3 text-sm font-semibold text-destructive bg-destructive-soft border border-border rounded-xl">{error}</div>}

      {g1 && g3 && (
        <>
          <p className="text-sm text-muted-foreground">
            These are working sheets prepared from your invoices and expenses. File the returns on the GST portal yourself
            and compare these figures before you do. Only issued tax invoices are counted; proformas and cancelled invoices are left out.
          </p>

          {g1.issues.length > 0 && (
            <div className="p-3 text-sm bg-warning-soft border border-border rounded-xl text-warning space-y-1">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="w-4 h-4" /> Fix before filing</div>
              <ul className="list-disc pl-6">{g1.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          )}

          <div className={`${cardClass} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-foreground">GSTR-3B summary</h2>
              <a href={csv("3b")} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground border border-input rounded-xl hover:bg-muted">
                <Download className="w-4 h-4" /> CSV
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full mt-2 text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2 font-semibold">Section</th>
                    <th className="py-2 font-semibold text-right">Taxable value</th>
                    <th className="py-2 font-semibold text-right">IGST</th>
                    <th className="py-2 font-semibold text-right">CGST</th>
                    <th className="py-2 font-semibold text-right">SGST</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">3.1(a) Tax collected on sales</td>
                    <td className="py-2 text-right"><Money value={g3.outward.taxable} /></td>
                    <td className="py-2 text-right"><Money value={g3.outward.igst} /></td>
                    <td className="py-2 text-right"><Money value={g3.outward.cgst} /></td>
                    <td className="py-2 text-right"><Money value={g3.outward.sgst} /></td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">4(A) Input tax credit ({g3.itcBills} bill{g3.itcBills === 1 ? "" : "s"})</td>
                    <td className="py-2 text-right">—</td>
                    <td className="py-2 text-right"><Money value={g3.itc.igst} /></td>
                    <td className="py-2 text-right"><Money value={g3.itc.cgst} /></td>
                    <td className="py-2 text-right"><Money value={g3.itc.sgst} /></td>
                  </tr>
                  <tr className="font-bold">
                    <td className="py-2">Net tax payable</td>
                    <td className="py-2 text-right">—</td>
                    <td className="py-2 text-right"><Money value={g3.payable.igst} /></td>
                    <td className="py-2 text-right"><Money value={g3.payable.cgst} /></td>
                    <td className="py-2 text-right"><Money value={g3.payable.sgst} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-base font-bold text-foreground">Total to pay: <Money value={g3.payable.total} /></p>
            {g3.notes.map((n) => <p key={n} className="text-sm text-warning mt-1">{n}</p>)}
          </div>

          <div className={`${cardClass} p-4 text-sm text-foreground`}>
            <h2 className="text-base font-bold text-foreground">GSTR-1 documents issued</h2>
            {g1.documents.total === 0 ? (
              <p className="mt-1">No tax invoices this month.</p>
            ) : (
              <p className="mt-1">
                {g1.documents.total} invoice{g1.documents.total === 1 ? "" : "s"} from <strong>{g1.documents.from}</strong> to{" "}
                <strong>{g1.documents.to}</strong>, of which {g1.documents.cancelled} cancelled.
              </p>
            )}
          </div>

          <Sheet title="B2B invoices (customer has a GSTIN)" name="b2b" csv={csv("b2b")} count={g1.b2b.length}
            head={["GSTIN", "Customer", "Invoice", "Date", "Invoice value", "Place of supply", "Rate", "Taxable", "IGST", "CGST", "SGST"]}
            rows={g1.b2b.map((r) => [r.gstin, r.customer, r.invoiceNumber, r.date, r.invoiceValue, stateName(r.placeOfSupply), `${r.rate}%`, r.taxable, r.igst, r.cgst, r.sgst])} />
          <Sheet title="B2C large (inter-state, above ₹2.5 lakh)" name="b2cl" csv={csv("b2cl")} count={g1.b2cl.length}
            head={["Invoice", "Date", "Invoice value", "Place of supply", "Rate", "Taxable", "IGST"]}
            rows={g1.b2cl.map((r) => [r.invoiceNumber, r.date, r.invoiceValue, stateName(r.placeOfSupply), `${r.rate}%`, r.taxable, r.igst])} />
          <Sheet title="B2C small (summary by state and rate)" name="b2cs" csv={csv("b2cs")} count={g1.b2cs.length}
            head={["Type", "Place of supply", "Rate", "Taxable", "IGST", "CGST", "SGST"]}
            rows={g1.b2cs.map((r) => [r.type, stateName(r.placeOfSupply), `${r.rate}%`, r.taxable, r.igst, r.cgst, r.sgst])} />
          <Sheet title="HSN / SAC summary" name="hsn" csv={csv("hsn")} count={g1.hsn.length}
            head={["HSN/SAC", "Unit", "Quantity", "Rate", "Taxable", "IGST", "CGST", "SGST"]}
            rows={g1.hsn.map((r) => [r.hsn, r.uqc, r.quantity, `${r.rate}%`, r.taxable, r.igst, r.cgst, r.sgst])} />
        </>
      )}

      <div className={`${cardClass} p-4`}>
        <h2 className="text-base font-bold text-foreground flex items-center gap-2"><FileCode2 className="w-5 h-5" /> Export to Tally</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Downloads sales invoices, payments received and expenses as a Tally import file. In Tally open
          Gateway of Tally &gt; Import &gt; Data and choose the file. Create a backup of the Tally company first.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <select value={tallyPeriod} onChange={(e) => setTallyPeriod(e.target.value)} aria-label="Period to export" className={selectClass}>
            {years.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
            <option value="all">All time</option>
          </select>
          <a href={`/api/v1/accounts/tally?period=${encodeURIComponent(tallyPeriod)}`} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-primary-hover">
            <Download className="w-4 h-4" /> Download Tally XML
          </a>
        </div>
      </div>
    </div>
  );
}

function Sheet({ title, csv, count, head, rows }: { title: string; name: Sheet; csv: string; count: number; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className={`${cardClass} p-4`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{title} <span className="text-muted-foreground font-semibold">({count})</span></h2>
        {count > 0 && (
          <a href={csv} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-foreground border border-input rounded-xl hover:bg-muted">
            <Download className="w-4 h-4" /> CSV
          </a>
        )}
      </div>
      {count === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">Nothing to report this month.</p>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                {head.map((h) => <th key={h} className="py-2 pr-3 font-semibold whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-border">
                  {r.map((c, j) => (
                    <td key={j} className="py-2 pr-3 whitespace-nowrap tabular-nums">
                      {typeof c === "number" && j > 0 && head[j] !== "Quantity" ? <Money value={c} /> : c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
