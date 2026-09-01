import { NextResponse } from "next/server";
import axios from "axios";
import { auth } from "@/lib/auth";

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const WABA_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "846902928412722";

/**
 * GET /api/v1/whatsapp/templates
 * Fetches approved WhatsApp message templates from Meta Cloud API (AiSensy/Zoho tier)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token =
      process.env.WHATSAPP_TOKEN ||
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "WhatsApp Access Token not configured in environment" },
        { status: 400 }
      );
    }

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WABA_ID}/message_templates?access_token=${token}`;
    const res = await axios.get(url);

    const templates = (res.data?.data || []).map((t: any) => {
      const bodyComponent = t.components?.find((c: any) => c.type === "BODY");
      const headerComponent = t.components?.find((c: any) => c.type === "HEADER");

      return {
        id: t.id,
        name: t.name,
        language: t.language || "en",
        status: t.status,
        category: t.category,
        headerFormat: headerComponent?.format || "NONE",
        bodyText: bodyComponent?.text || "",
        exampleVars: bodyComponent?.example?.body_text?.[0] || [],
        components: t.components || [],
      };
    });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (err: any) {
    console.error("GET WhatsApp Templates Error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data?.error?.message || "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
