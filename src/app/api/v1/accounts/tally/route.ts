import { NextResponse } from "next/server";
import { requireInvoiceAdmin } from "@/lib/invoice/service";
import { loadBooks } from "@/lib/accounts/service";
import { buildTallyXml } from "@/lib/accounts/tally";
import { parsePeriod } from "@/lib/accounts/period";

// GET /api/v1/accounts/tally?period=all|fy:2026|month:2026-11 — Tally import file
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin("accounts.gst"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const period = new URL(req.url).searchParams.get("period");
    const range = parsePeriod(period);
    if (range === "invalid") return NextResponse.json({ error: "Invalid period" }, { status: 400 });

    const books = await loadBooks(range ?? undefined);
    const xml = buildTallyXml(books);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="Tzar-Tally-${(period || "all").replace(":", "-")}.xml"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Tally export error:", error);
    return NextResponse.json({ error: "Failed to build Tally file" }, { status: 500 });
  }
}
