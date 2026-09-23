import { NextResponse } from "next/server";
import { runMetaAutoSync } from "@/lib/meta-sync-engine";
import { BusinessSlug } from "@/models/Lead";

// In-memory throttling cache to prevent Meta API rate-limiting
let lastSyncTimestamp = 0;
let lastSyncSummary: any = null;
const SYNC_COOLDOWN_MS = 20000; // 20-second debounce between full scans

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const business = searchParams.get("business") as BusinessSlug | null;
    const force = searchParams.get("force") === "true";

    const includeArchived = searchParams.get("includeArchived") === "true";

    const now = Date.now();
    if (!force && lastSyncSummary && now - lastSyncTimestamp < SYNC_COOLDOWN_MS) {
      return NextResponse.json({
        cached: true,
        summary: lastSyncSummary,
        message: "Sync recently completed. Returning cached telemetry.",
      });
    }

    const summary = await runMetaAutoSync(business || undefined, includeArchived);
    lastSyncTimestamp = now;
    lastSyncSummary = summary;

    return NextResponse.json({
      cached: false,
      summary,
      message: `Meta auto-sync completed: ${summary.totalSynced} new leads ingested, ${summary.totalSkipped} duplicates skipped.`,
    });
  } catch (error: any) {
    console.error("Meta Auto-Sync Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Meta auto-sync" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is fine
    }

    const business = body.business as BusinessSlug | undefined;
    const includeArchived = !!body.includeArchived;
    const summary = await runMetaAutoSync(business, includeArchived);
    lastSyncTimestamp = Date.now();
    lastSyncSummary = summary;

    return NextResponse.json({
      success: true,
      summary,
      message: `Meta auto-sync executed: ${summary.totalSynced} new leads ingested across all active forms.`,
    });
  } catch (error: any) {
    console.error("Meta Auto-Sync POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute Meta auto-sync" },
      { status: 500 }
    );
  }
}
