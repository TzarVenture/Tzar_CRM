import { NextResponse } from "next/server";
import axios from "axios";

/**
 * GET & POST: Utility route to subscribe Facebook Page to Meta App leadgen webhooks
 */
export async function GET(req: Request) {
  try {
    const token =
      process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN ||
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Meta Access Token in environment variables" },
        { status: 400 }
      );
    }

    // Call Meta Graph API subscribed_apps for Page / WABA leadgen streaming
    const res = await axios.post(
      `https://graph.facebook.com/v20.0/me/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: "leadgen",
          access_token: token,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Facebook Page successfully subscribed to Meta App leadgen webhooks!",
      metaResponse: res.data,
    });
  } catch (error: any) {
    console.error("GET Subscribe Page Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to subscribe Page to Meta App",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pageId, pageAccessToken } = body;

    const token =
      pageAccessToken ||
      process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN ||
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN ||
      process.env.WHATSAPP_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Meta Access Token" },
        { status: 400 }
      );
    }

    const targetPageId = pageId || "me";

    const res = await axios.post(
      `https://graph.facebook.com/v20.0/${targetPageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: "leadgen",
          access_token: token,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Facebook Page successfully subscribed to Meta App leadgen webhooks!",
      metaResponse: res.data,
    });
  } catch (error: any) {
    console.error("POST Subscribe Page Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to subscribe Page to Meta App",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
