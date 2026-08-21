import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead, { BusinessSlug } from "@/models/Lead";
import Message from "@/models/Message";
import ChatbotRule from "@/models/ChatbotRule";
import {
  sendWhatsAppTextMessage,
  sendWhatsAppTemplateMessage,
  sendWhatsAppDocumentMessage,
} from "@/lib/whatsapp";
import {
  getDefaultPipeline,
  getAssignedBDE,
  generateLeadCustomId,
} from "@/lib/lead-utils";

/**
 * 1. GET: Meta WhatsApp Webhook Verification Challenge
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const allowedTokens = [
    process.env.WHATSAPP_VERIFY_TOKEN,
    process.env.META_VERIFY_TOKEN,
    "tzar_meta_webhook_verify_token_2026",
    "tzar_whatsapp_webhook_verify_token_2026",
  ].filter(Boolean);

  if (mode === "subscribe" && token && allowedTokens.includes(token)) {
    console.log("✅ Meta WhatsApp Cloud API Webhook verified successfully!");
    return new Response(challenge || "OK", { status: 200 });
  }

  return new Response("Forbidden: Invalid Verify Token", { status: 403 });
}

/**
 * 2. POST: Inbound WhatsApp Messages & Status Updates Listener
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await dbConnect();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (!changes) {
      return NextResponse.json({ status: "ignored", reason: "no changes value" });
    }

    // A. Handle Status Updates (sent, delivered, read)
    if (changes.statuses && Array.isArray(changes.statuses)) {
      for (const statusObj of changes.statuses) {
        const messageId = statusObj.id;
        const statusStr = statusObj.status?.toUpperCase();

        if (messageId && statusStr) {
          await Message.updateOne(
            { externalMessageId: messageId },
            { $set: { status: statusStr } }
          );
        }
      }
      return NextResponse.json({ status: "processed_statuses" });
    }

    // B. Handle Inbound Message Payload
    const message = changes.messages?.[0];
    const contact = changes.contacts?.[0];

    if (message) {
      const fromPhone = message.from; // Sender phone number
      const senderName = contact?.profile?.name || "WhatsApp Contact";
      const messageType = message.type;
      let textContent = "";

      if (messageType === "text") {
        textContent = message.text?.body || "";
      } else if (messageType === "interactive") {
        textContent =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          "";
      } else if (messageType === "button") {
        textContent = message.button?.text || "";
      } else {
        textContent = `[Attachment: ${messageType}]`;
      }

      // Find or Create Lead Record
      let lead = await Lead.findOne({
        phone: { $regex: fromPhone.slice(-10) },
      });

      if (!lead) {
        const pipeline = await getDefaultPipeline();
        const assignedTo = await getAssignedBDE();
        const leadCustomId = await generateLeadCustomId("tzar");
        const slaDeadline = new Date();
        slaDeadline.setHours(slaDeadline.getHours() + 24);

        lead = await Lead.create({
          leadCustomId,
          business: "tzar",
          fullName: senderName,
          email: `${fromPhone}@whatsapp.inbound`,
          phone: `+${fromPhone}`,
          source: "WHATSAPP_INBOUND",
          pipelineId: pipeline._id,
          stageId: "new-lead",
          assignedTo,
          status: "ACTIVE",
          slaDeadline,
          score: 25,
        });
      }

      // Record Inbound Message in DB
      await Message.create({
        leadId: lead._id,
        channel: "WHATSAPP",
        direction: "INBOUND",
        content: textContent,
        status: "DELIVERED",
        externalMessageId: message.id,
        senderInfo: { name: senderName, phoneOrEmail: fromPhone },
      });

      // C. Trigger AiSensy / ChatbotWonder Automated Keyword Engine
      if (textContent.trim()) {
        const activeRules = await ChatbotRule.find({ isActive: true });
        const cleanMsg = textContent.toLowerCase().trim();

        for (const rule of activeRules) {
          const kw = rule.triggerKeyword.toLowerCase().trim();
          let isMatch = false;

          if (rule.matchType === "EXACT" && cleanMsg === kw) isMatch = true;
          if (rule.matchType === "CONTAINS" && cleanMsg.includes(kw)) isMatch = true;

          if (isMatch) {
            console.log(`🤖 Chatbot Keyword Rule Matched: "${kw}" for lead ${lead.fullName}`);

            // Action 1: Reply Text
            if (rule.actionType === "REPLY_TEXT" && rule.replyContent) {
              await sendWhatsAppTextMessage(fromPhone, rule.replyContent);
            }

            // Action 2: Send Template Message
            if (rule.actionType === "SEND_TEMPLATE" && rule.templateName) {
              await sendWhatsAppTemplateMessage(
                fromPhone,
                rule.templateName,
                "en_US",
                [{ type: "body", parameters: [{ type: "text", text: lead.fullName }] }]
              );
            }

            // Action 3: Update Lead Stage
            if (rule.actionType === "CHANGE_STAGE" && rule.targetStageId) {
              lead.stageId = rule.targetStageId as any;
              await lead.save();
            }

            // Action 4: Boost Engagement Score
            if (rule.actionType === "UPDATE_SCORE" && rule.scoreBoost) {
              lead.score += rule.scoreBoost;
              await lead.save();
            }

            break; // Stop at first matched rule
          }
        }
      }

      return NextResponse.json({ status: "processed_message", leadId: lead._id });
    }

    return NextResponse.json({ status: "ignored" });
  } catch (error) {
    console.error("❌ WhatsApp Webhook Inbound Error:", error);
    return NextResponse.json(
      { error: "Failed to process WhatsApp webhook payload" },
      { status: 500 }
    );
  }
}
