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

    const token = pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN || process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Page Access Token missing. Please provide a valid Page Access Token." },
        { status: 400 }
      );
    }

    // Step 1: Check token & page info
    let targetPageId = pageId;
    if (!targetPageId) {
      try {
        const meRes = await axios.get(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${token}`);
        targetPageId = meRes.data.id;
      } catch (err: any) {
        return NextResponse.json(
          {
            error: "Failed to verify Page Access Token with Meta Graph API.",
            details: err.response?.data || err.message,
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Subscribe Page to Tzar_App (leadgen webhook field)
    const subRes = await axios.post(
      `https://graph.facebook.com/v20.0/${targetPageId}/subscribed_apps`,
      null,
      {
        params: {
          subscribed_fields: "leadgen,messages",
          access_token: token,
        },
      }
    );

    return NextResponse.json({
      status: "success",
      pageId: targetPageId,
      result: subRes.data,
      message: `Successfully subscribed Facebook Page (${targetPageId}) to Tzar_App Lead Ads Webhooks!`,
    });
  } catch (error: any) {
    console.error("Page Subscription Error:", error.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to subscribe Page to Tzar_App Webhooks.",
        details: error.response?.data?.error || error.message,
      },
      { status: 400 }
    );
  }
}
