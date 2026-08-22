import axios from "axios";

/**
 * Meta WhatsApp Business Cloud API Configuration
 */
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN || process.env.META_SYSTEM_USER_TOKEN || "";

/**
 * Format phone number to E.164 (without +)
 * e.g., "+91 98765 43210" -> "919876543210"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  // Default to India country code 91 if 10 digits
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

/**
 * 1. Send Outbound Text Message via Meta Cloud API
 */
export async function sendWhatsAppTextMessage(recipientPhone: string, text: string) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn("⚠️ Meta WhatsApp Cloud API credentials missing in environment variables.");
    return { success: false, reason: "Credentials missing in env" };
  }

  const to = formatPhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Meta WhatsApp Send Text Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 2. Send Approved HSM Template Message (e.g. Welcome, Reminders, Offers)
 */
export async function sendWhatsAppTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode: string = "en_US",
  components: any[] = []
) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn("⚠️ Meta WhatsApp Cloud API credentials missing.");
    return { success: false, reason: "Credentials missing in env" };
  }

  const to = formatPhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Meta WhatsApp Send Template Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 3. Send PDF Document Attachment (Brochure, Contract, Invoice)
 */
export async function sendWhatsAppDocumentMessage(
  recipientPhone: string,
  documentUrl: string,
  filename: string,
  caption?: string
) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { success: false, reason: "Credentials missing in env" };
  }

  const to = formatPhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          link: documentUrl,
          filename,
          caption: caption || filename,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Meta WhatsApp Send Document Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Send Image Attachment (JPEG/PNG)
 */
export async function sendWhatsAppImageMessage(
  recipientPhone: string,
  imageUrl: string,
  caption?: string
) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { success: false, reason: "Credentials missing in env" };
  }

  const to = formatPhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image: {
          link: imageUrl,
          caption: caption || "",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Meta WhatsApp Send Image Error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * 4. Send Interactive CTA Button / Quick Reply Message (AiSensy / ChatbotWonder Style)
 */
export async function sendWhatsAppInteractiveButtonMessage(
  recipientPhone: string,
  bodyText: string,
  buttons: { id: string; title: string }[]
) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    return { success: false, reason: "Credentials missing in env" };
  }

  const to = formatPhoneNumber(recipientPhone);
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const formattedButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: {
      id: b.id,
      title: b.title.slice(0, 20), // Meta limit 20 chars
    },
  }));

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText },
          action: { buttons: formattedButtons },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error: any) {
    console.error("❌ Meta WhatsApp Send Interactive Button Error:", error.response?.data || error.message);
    throw error;
  }
}
