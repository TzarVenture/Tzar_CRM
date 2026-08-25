import { NextResponse } from "next/server";
import axios from "axios";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pageId, pageAccessToken } = body;

    const token =
      pageAccessToken ||
      process.env.META_PAGE_ACCESS_TOKEN ||
      process.env.META_SYSTEM_USER_TOKEN ||
      process.env.WHATSAPP_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Missing Meta Page Access Token" },
        { status: 400 }
      );
    }

    const targetPageId = pageId || "me";

    // Call Meta Graph API to subscribe the Facebook Page to the App's leadgen webhooks
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

    return NextResponse.json(
      {
        success: true,
        message: "Facebook Page successfully subscribed to Meta App leadgen webhooks!",
        metaResponse: res.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to subscribe Facebook Page:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to subscribe Page to Meta App",
        details: error.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}
