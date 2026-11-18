import { NextResponse } from "next/server";
import { requireInvoiceAdmin } from "@/lib/invoice/service";
import { loadBooks } from "@/lib/accounts/service";
import { buildOverview } from "@/lib/accounts/overview";
import { parsePeriod } from "@/lib/accounts/period";

// GET /api/v1/accounts/overview?period=all|fy:2026|month:2026-11
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin("accounts.overview"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const range = parsePeriod(new URL(req.url).searchParams.get("period"));
    if (range === "invalid") return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    const { invoices, payments, expenses } = await loadBooks(range ?? undefined);
    return NextResponse.json({ overview: buildOverview(invoices, payments, expenses) });
  } catch (error) {
    console.error("Accounts overview error:", error);
    return NextResponse.json({ error: "Failed to build overview" }, { status: 500 });
  }
}
