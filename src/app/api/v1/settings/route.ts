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
          tzarIngestKey: process.env.TZAR_INGEST_API_KEY,
          whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
          metaVerifyToken: process.env.META_VERIFY_TOKEN,
          metaAppSecretConfigured: Boolean(process.env.META_APP_SECRET),
          appUrl: process.env.NEXT_PUBLIC_APP_URL || "",
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
