import { NextResponse } from "next/server";
import axios from "axios";

/**
 * Subscribes the Meta WABA Account to the CRM Meta Developer App to activate live inbound webhooks
 */
export async function POST() {
  try {
    const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "846902928412722";
    const token =
      process.env.WHATSAPP_TOKEN ||
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "WHATSAPP_TOKEN missing in environment" },
        { status: 400 }
      );
    }

    const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;

    const res = await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Meta WABA Subscribed Apps Response:", res.data);

    return NextResponse.json(
      {
        success: true,
        wabaId,
        metaResponse: res.data,
        message: "Successfully subscribed WABA account to CRM Meta Developer App for live inbound webhooks!",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Failed to subscribe WABA account:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to subscribe WABA account",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
