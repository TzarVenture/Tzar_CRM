import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Super Admin only" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        settings: {
          tzarIngestKey: process.env.TZAR_INGEST_API_KEY || "tzar_live_ingest_key_998877665544332211",
          whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "tzar_whatsapp_webhook_verify_token_2026",
          metaVerifyToken: process.env.META_VERIFY_TOKEN || "tzar_meta_webhook_verify_token_2026",
          awsRegion: process.env.AWS_REGION || "ap-south-1",
          s3BucketName: process.env.AWS_S3_BUCKET_NAME || "tzar-crm-file-assets",
          slaDeadlineHours: 24,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Settings Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
