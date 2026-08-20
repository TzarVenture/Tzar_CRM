import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Lead from "@/models/Lead";
import ChatbotRule from "@/models/ChatbotRule";

/**
 * 1. GET: Verification Handler for Meta Webhook Setup
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "tzar_whatsapp_webhook_verify_token_2026";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ WhatsApp Webhook verified successfully!");
    return new Response(challenge || "OK", { status: 200 });
  }

  return new Response("Forbidden: Invalid Verify Token", { status: 403 });
}

/**
 * 2. POST: Inbound Message & Status Callback Listener + ChatbotWonder Auto-Responder
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    const entry = body.entry?.[0]?.changes?.[0]?.value;
    if (!entry) {
      return NextResponse.json({ status: "ignored", reason: "no entry value" });
    }

    // Handle Incoming Messages
    if (entry.messages && entry.messages.length > 0) {
      const msg = entry.messages[0];
      const rawFrom = String(msg.from);
      const fromPhone = rawFrom.startsWith("+") ? rawFrom : `+${rawFrom}`;
      const textContent =
        msg.text?.body || msg.caption || (msg.type ? `[${msg.type.toUpperCase()} Message]` : "[Media Message]");
      const externalMsgId = msg.id;

      // Find matching lead by phone number
      const sanitizedPhone = fromPhone.replace(/[^0-9]/g, "");
      const lead = await Lead.findOne({
        phone: { $regex: sanitizedPhone.slice(-10), $options: "i" },
      });

      // Insert message record
      const newMessage = await Message.create({
        leadId: lead?._id || undefined,
        channel: "WHATSAPP",
        direction: "INBOUND",
        senderInfo: {
          name: entry.contacts?.[0]?.profile?.name || lead?.fullName || "WhatsApp Contact",
          phoneOrEmail: fromPhone,
        },
        content: textContent,
        externalMessageId: externalMsgId,
        status: "DELIVERED",
        isRead: false,
      });

      // Increment lead score on customer message engagement
      if (lead) {
        lead.score += 5;
        await lead.save();
      }

      // --- CHATBOTWONDER AUTO-RESPONDER ENGINE ---
      const cleanLowerMsg = textContent.toLowerCase();
      const activeRules = await ChatbotRule.find({ isActive: true });

      for (const rule of activeRules) {
        const isMatched =
          rule.matchType === "EXACT"
            ? cleanLowerMsg.trim() === rule.triggerKeyword.trim()
            : cleanLowerMsg.includes(rule.triggerKeyword.trim());

        if (isMatched) {
          console.log(`🤖 ChatbotWonder Trigger Matched: "${rule.triggerKeyword}" for ${fromPhone}`);

          // Update Lead Score & Stage if rule mandates it
          if (lead) {
            if (rule.scoreBoost) lead.score += rule.scoreBoost;
            if (rule.targetStageId) lead.stageId = rule.targetStageId as any;
            await lead.save();
          }

          // Dispatch Automated Outbound Bot Response
          if (rule.replyContent) {
            await Message.create({
              leadId: lead?._id || undefined,
              channel: "WHATSAPP",
              direction: "OUTBOUND",
              senderInfo: {
                name: "AI Chatbot Assistant",
                phoneOrEmail: "bot@tzar.agency",
              },
              content: rule.replyContent,
              externalMessageId: `wmid.bot_${Date.now()}`,
              status: "DELIVERED",
              isRead: true,
            });
          }
          break; // Stop after first matched rule
        }
      }

      return NextResponse.json(
        { status: "success", messageId: newMessage._id },
        { status: 200 }
      );
    }

    // Handle Status Callbacks
    if (entry.statuses && entry.statuses.length > 0) {
      const statusObj = entry.statuses[0];
      const statusUpper = statusObj.status?.toUpperCase();

      if (["SENT", "DELIVERED", "READ", "FAILED"].includes(statusUpper)) {
        await Message.updateOne(
          { externalMessageId: statusObj.id },
          { status: statusUpper }
        );
      }

      return NextResponse.json({ status: "status_updated" }, { status: 200 });
    }

    return NextResponse.json({ status: "ignored" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error in WhatsApp Webhook" },
      { status: 500 }
    );
  }
}
