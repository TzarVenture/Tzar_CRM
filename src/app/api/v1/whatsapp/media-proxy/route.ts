import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaUrl = searchParams.get("url");
    const mediaId = searchParams.get("mediaId");

    const token =
      process.env.WHATSAPP_TOKEN ||
      process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
      process.env.WHATSAPP_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "WHATSAPP_TOKEN missing" },
        { status: 400 }
      );
    }

    let targetUrl = mediaUrl;

    // If mediaId provided instead of direct lookaside URL, resolve it first
    if (!targetUrl && mediaId) {
      const metaRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      targetUrl = metaRes.url;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: "Media URL or Media ID is required" },
        { status: 400 }
      );
    }

    // Fetch binary payload from Meta CDN with Authorization header
    const response = await fetch(targetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Meta Media Fetch Failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Meta Media Proxy Error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const isDownload = searchParams.get("download") === "true";
    const customFilename = searchParams.get("filename") || "WhatsApp_Attachment";

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await response.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    };

    if (isDownload) {
      responseHeaders["Content-Disposition"] = `attachment; filename="${customFilename}"`;
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("❌ Media Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to proxy media file" },
      { status: 500 }
    );
  }
}
