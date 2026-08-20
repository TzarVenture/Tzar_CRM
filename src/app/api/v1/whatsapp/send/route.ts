import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import Lead from "@/models/Lead";
import { auth } from "@/lib/auth";

const SendWhatsAppSchema = z.object({
  leadId: z.string().optional(),
  recipientPhone: z.string().min(5, "Recipient phone is required"),
  messageType: z.enum(["text", "template"]).default("text"),
  content: z.string().min(1, "Message content cannot be empty"),
  templateName: z.string().optional(),
  templateParams: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = SendWhatsAppSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      leadId,
      recipientPhone,
      messageType,
      content,
      templateName,
      templateParams,
    } = parseResult.data;

    await dbConnect();

    // Find lead if leadId provided
    const lead = leadId ? await Lead.findById(leadId) : null;

    let externalMsgId = `wmid.mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    let messageStatus: "SENT" | "DELIVERED" | "FAILED" = "DELIVERED";

    // Attempt live Meta WhatsApp Cloud API call if token is configured
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken =
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN;

    if (phoneNumberId && accessToken && accessToken.startsWith("EAA")) {
      try {
        let cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.length === 10) {
          cleanPhone = `91${cleanPhone}`;
        } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
          cleanPhone = `91${cleanPhone.substring(1)}`;
        }

        let metaPayload: Record<string, unknown>;

        if (messageType === "template" && templateName) {
          const components =
            templateParams && templateParams.length > 0
              ? [
                  {
                    type: "body",
                    parameters: templateParams.map((p) => ({
                      type: "text",
                      text: p,
                    })),
                  },
                ]
              : undefined;

          metaPayload = {
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "en_US" },
              ...(components ? { components } : {}),
            },
          };
        } else {
          metaPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: { preview_url: true, body: content },
          };
        }

        const metaRes = await axios.post(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          metaPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (metaRes.data?.messages?.[0]?.id) {
          externalMsgId = metaRes.data.messages[0].id;
          messageStatus = "SENT";
        }
      } catch (metaErr: unknown) {
        const errData = axios.isAxiosError(metaErr) ? metaErr.response?.data?.error : null;
        console.error(
          "Meta Cloud API Outbound Error Details:",
          errData || metaErr
        );
        messageStatus = "FAILED";
      }
    }

    // Save outbound message to MongoDB
    const newMessage = await Message.create({
      leadId: lead?._id || undefined,
      channel: "WHATSAPP",
      direction: "OUTBOUND",
      senderId: session.user.id,
      senderInfo: {
        name: session.user.name || "Agent",
        phoneOrEmail: session.user.email || undefined,
      },
      content: content,
      externalMessageId: externalMsgId,
      status: messageStatus,
      isRead: true,
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("POST Send WhatsApp Error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch WhatsApp message" },
      { status: 500 }
    );
  }
}
