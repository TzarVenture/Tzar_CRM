import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import {
  clearFailures,
  isLockedOut,
  passcodeMatches,
  recordFailure,
} from "@/lib/portal-passcode";

/** Public, non-secret info only. The passcode is never sent to the browser. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    await dbConnect();
    const client = await Client.findById(clientId).select(
      "companyName onboardingCompleted portalAccessActive"
    );
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json({ client }, { status: 200 });
  } catch (error) {
    console.error("GET Portal Client Error:", error);
    return NextResponse.json({ error: "Failed to fetch portal client data" }, { status: 500 });
  }
}

/** Passcode check happens here, on the server. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await req.json().catch(() => ({}));
    const passcode = String(body?.passcode ?? "");
    const key = clientId;
    if (isLockedOut(key)) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }
    await dbConnect();
    const client = await Client.findById(clientId).select("+portalPasscode portalAccessActive");
    if (!client || client.portalAccessActive === false || !passcodeMatches(passcode, client.portalPasscode)) {
      recordFailure(key);
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }
    clearFailures(key);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("POST Portal verify Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
