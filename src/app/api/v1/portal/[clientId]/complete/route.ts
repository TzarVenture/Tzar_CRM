import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Client from "@/models/Client";
import { isLockedOut, passcodeMatches, recordFailure } from "@/lib/portal-passcode";

const CompleteOnboardingSchema = z.object({
  passcode: z.string().min(1),
  websiteUrl: z.string().optional(),
  targetAudience: z.string().optional(),
  primaryGoal: z.string().optional(),
  brandNotes: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const body = await req.json();

    const parseResult = CompleteOnboardingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { passcode, websiteUrl, targetAudience, primaryGoal, brandNotes } = parseResult.data;
    await dbConnect();

    if (isLockedOut(clientId)) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }
    const client = await Client.findById(clientId).select("+portalPasscode");
    if (!client || !passcodeMatches(passcode, client.portalPasscode)) {
      recordFailure(clientId);
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }

    client.onboardingCompleted = true;
    client.onboardingData = {
      websiteUrl,
      targetAudience,
      primaryGoal,
      brandNotes,
      completedAt: new Date(),
    };

    await client.save();

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("Complete Onboarding Error:", error);
    return NextResponse.json(
      { error: "Failed to complete client onboarding" },
      { status: 500 }
    );
  }
}
