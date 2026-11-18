import { NextResponse } from "next/server";
import { requireInvoiceAdmin } from "@/lib/invoice/service";
import { loadBooks } from "@/lib/accounts/service";
import { buildGstr1, buildGstr3b, toCsv } from "@/lib/accounts/gst";
import { MONTH_FORMAT, monthRange } from "@/lib/accounts/period";

const SECTIONS = ["b2b", "b2cl", "b2cs", "hsn", "3b"] as const;

// GET /api/v1/accounts/gst?month=2026-11            -> GSTR-1 and GSTR-3B working figures (JSON)
// GET /api/v1/accounts/gst?month=2026-11&csv=b2b    -> one sheet as a CSV download
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin("accounts.gst"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const params = new URL(req.url).searchParams;
    const month = params.get("month") || "";
    if (!MONTH_FORMAT.test(month)) return NextResponse.json({ error: "Choose a month" }, { status: 400 });

    const { invoices, expenses } = await loadBooks(monthRange(month));
    const gstr1 = buildGstr1(invoices);
    const gstr3b = buildGstr3b(invoices, expenses);

    const csv = params.get("csv");
    if (!csv) return NextResponse.json({ month, gstr1, gstr3b });
    if (!(SECTIONS as readonly string[]).includes(csv)) return NextResponse.json({ error: "Unknown sheet" }, { status: 400 });

    let body = "";
    if (csv === "b2b" || csv === "b2cl") {
      const rows = gstr1[csv];
      body = toCsv(
        ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Rate", "Taxable Value", "IGST", "CGST", "SGST"],
        rows.map((r) => [r.gstin, r.customer, r.invoiceNumber, r.date, r.invoiceValue, r.placeOfSupply, r.rate, r.taxable, r.igst, r.cgst, r.sgst])
      );
    } else if (csv === "b2cs") {
      body = toCsv(
        ["Type", "Place Of Supply", "Rate", "Taxable Value", "IGST", "CGST", "SGST"],
        gstr1.b2cs.map((r) => [r.type, r.placeOfSupply, r.rate, r.taxable, r.igst, r.cgst, r.sgst])
      );
    } else if (csv === "hsn") {
      body = toCsv(
        ["HSN", "UQC", "Total Quantity", "Rate", "Taxable Value", "IGST", "CGST", "SGST"],
        gstr1.hsn.map((r) => [r.hsn, r.uqc, r.quantity, r.rate, r.taxable, r.igst, r.cgst, r.sgst])
      );
    } else {
      body = toCsv(
        ["Section", "Taxable Value", "IGST", "CGST", "SGST"],
        [
          ["3.1(a) Outward taxable supplies", gstr3b.outward.taxable, gstr3b.outward.igst, gstr3b.outward.cgst, gstr3b.outward.sgst],
          ["4(A) Input tax credit", "", gstr3b.itc.igst, gstr3b.itc.cgst, gstr3b.itc.sgst],
          ["Net tax payable", "", gstr3b.payable.igst, gstr3b.payable.cgst, gstr3b.payable.sgst],
        ]
      );
    }
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="GSTR-${csv === "3b" ? "3B" : "1-" + csv.toUpperCase()}-${month}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("GST report error:", error);
    return NextResponse.json({ error: "Failed to build GST report" }, { status: 500 });
  }
}
