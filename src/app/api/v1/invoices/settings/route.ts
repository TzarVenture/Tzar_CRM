import { NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/db";
import InvoiceSettings from "@/models/InvoiceSettings";
import { requireInvoiceAdmin, getInvoiceSettings } from "@/lib/invoice/service";

const text = z.string().trim().max(2000).optional().default("");

const SettingsSchema = z.object({
  sellerEmail: text,
  sellerPhone: text,
  signatoryName: text,
  bank: z
    .object({
      accountName: text,
      bankName: text,
      accountNumber: text,
      ifsc: text,
      branch: text,
      upiId: text,
    })
    .optional()
    .default({ accountName: "", bankName: "", accountNumber: "", ifsc: "", branch: "", upiId: "" }),
  defaultTerms: text,
  defaultNotes: text,
});

export async function GET() {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    return NextResponse.json({ settings: await getInvoiceSettings() }, { status: 200 });
  } catch (error) {
    console.error("GET Invoice Settings Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const parsed = SettingsSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }
    await dbConnect();
    await InvoiceSettings.updateOne({ key: "default" }, { $set: parsed.data }, { upsert: true });
    return NextResponse.json({ settings: await getInvoiceSettings() }, { status: 200 });
  } catch (error) {
    console.error("PUT Invoice Settings Error:", error);
    return NextResponse.json({ error: "Failed to save invoice settings" }, { status: 500 });
  }
}
