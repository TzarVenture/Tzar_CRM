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
  messageType: z.enum(["text", "template", "document", "image"]).default("text"),
  content: z.string().min(1, "Message content cannot be empty"),
  mediaUrl: z.string().optional(),
  filename: z.string().optional(),
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
      mediaUrl,
      filename,
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
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_TOKEN;

    if (phoneNumberId && accessToken && accessToken.startsWith("EAA")) {
      let cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
      if (cleanPhone.length === 10) {
        cleanPhone = `91${cleanPhone}`;
      } else if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
        cleanPhone = `91${cleanPhone.substring(1)}`;
      }

      // Upload local base64 media file to Meta Graph API Media endpoint to get Meta media_id
      const uploadMediaToMeta = async (dataUrl: string): Promise<string | null> => {
        try {
          const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
          if (!matches) return null;

          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          const formData = new FormData();
          const blob = new Blob([buffer], { type: mimeType });
          formData.append("file", blob, filename || (mimeType.includes("pdf") ? "document.pdf" : "image.png"));
          formData.append("messaging_product", "whatsapp");

          const uploadRes = await axios.post(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          return uploadRes.data?.id || null;
        } catch (err: any) {
          console.error("❌ Failed to upload media buffer to Meta API:", err.response?.data || err.message);
          return null;
        }
      };

      const sendToMeta = async (langCode: string) => {
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
              language: { code: langCode },
              ...(components ? { components } : {}),
            },
          };
        } else if (messageType === "document" && mediaUrl) {
          let mediaId: string | null = null;
          if (mediaUrl.startsWith("data:")) {
            mediaId = await uploadMediaToMeta(mediaUrl);
          }

          metaPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "document",
            document: mediaId
              ? {
                  id: mediaId,
                  filename: filename || "document.pdf",
                  caption: content || filename || "Document Attachment",
                }
              : {
                  link: mediaUrl,
                  filename: filename || "document.pdf",
                  caption: content || filename || "Document Attachment",
                },
          };
        } else if (messageType === "image" && mediaUrl) {
          let mediaId: string | null = null;
          if (mediaUrl.startsWith("data:")) {
            mediaId = await uploadMediaToMeta(mediaUrl);
          }

          metaPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "image",
            image: mediaId
              ? {
                  id: mediaId,
                  caption: content || "",
                }
              : {
                  link: mediaUrl,
                  caption: content || "",
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

        return axios.post(
          `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
          metaPayload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
      };

      try {
        const metaRes = await sendToMeta("en_US");
        if (metaRes.data?.messages?.[0]?.id) {
          externalMsgId = metaRes.data.messages[0].id;
          messageStatus = "SENT";
        }
      } catch (firstErr: any) {
        if (messageType === "template") {
          try {
            console.log("⚠️ Retrying template with language code 'en'...");
            const fallbackRes = await sendToMeta("en");
            if (fallbackRes.data?.messages?.[0]?.id) {
              externalMsgId = fallbackRes.data.messages[0].id;
              messageStatus = "SENT";
            }
          } catch (retryErr: any) {
            console.error("❌ Meta Cloud API Outbound Template Error:", retryErr.response?.data?.error || retryErr.message);
            messageStatus = "FAILED";
          }
        } else {
          console.error("❌ Meta Cloud API Outbound Text/Media Error:", firstErr.response?.data?.error || firstErr.message);
          messageStatus = "FAILED";
        }
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
      mediaUrls: mediaUrl ? [mediaUrl] : undefined,
      mediaType: messageType === "image" ? "image" : messageType === "document" ? "document" : undefined,
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
