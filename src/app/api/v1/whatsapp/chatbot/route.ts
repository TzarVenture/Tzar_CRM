import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import ChatbotRule from "@/models/ChatbotRule";
import { auth } from "@/lib/auth";

const CreateRuleSchema = z.object({
  triggerKeyword: z.string().min(1, "Trigger keyword is required"),
  matchType: z.enum(["EXACT", "CONTAINS"]).default("CONTAINS"),
  actionType: z
    .enum(["REPLY_TEXT", "SEND_TEMPLATE", "UPDATE_SCORE", "CHANGE_STAGE"])
    .default("REPLY_TEXT"),
  replyContent: z.string().optional(),
  templateName: z.string().optional(),
  targetStageId: z.string().optional(),
  scoreBoost: z.number().optional().default(5),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let rules = await ChatbotRule.find().sort({ createdAt: -1 });

    // Seed default rules if empty
    if (rules.length === 0) {
      const sampleRules = [
        {
          triggerKeyword: "pricing",
          matchType: "CONTAINS",
          actionType: "REPLY_TEXT",
          replyContent:
            "Thanks for asking! Our web development & branding packages start at $5,000. Would you like to schedule a 15-min discovery call?",
          scoreBoost: 10,
          isActive: true,
          createdBy: session.user.id,
        },
        {
          triggerKeyword: "portfolio",
          matchType: "CONTAINS",
          actionType: "REPLY_TEXT",
          replyContent:
            "Check out our recent client case studies and digital transformation portfolio at: https://tzar.agency/case-studies",
          scoreBoost: 5,
          isActive: true,
          createdBy: session.user.id,
        },
        {
          triggerKeyword: "book call",
          matchType: "CONTAINS",
          actionType: "CHANGE_STAGE",
          targetStageId: "discovery-call",
          replyContent:
            "Great! You can pick a convenient time on our Calendly here: https://calendly.com/tzar-agency/discovery",
          scoreBoost: 20,
          isActive: true,
          createdBy: session.user.id,
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rules = (await ChatbotRule.insertMany(sampleRules as any)) as any;
    }

    return NextResponse.json({ rules }, { status: 200 });
  } catch (error) {
    console.error("GET Chatbot Rules Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chatbot rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = CreateRuleSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    await dbConnect();

    const newRule = await ChatbotRule.create({
      triggerKeyword: data.triggerKeyword.toLowerCase(),
      matchType: data.matchType,
      actionType: data.actionType,
      replyContent: data.replyContent,
      templateName: data.templateName,
      targetStageId: data.targetStageId,
      scoreBoost: data.scoreBoost,
      isActive: true,
      createdBy: session.user.id,
    });

    return NextResponse.json({ rule: newRule }, { status: 201 });
  } catch (error) {
    console.error("POST Chatbot Rule Error:", error);
    return NextResponse.json(
      { error: "Failed to create chatbot rule" },
      { status: 500 }
    );
  }
}
