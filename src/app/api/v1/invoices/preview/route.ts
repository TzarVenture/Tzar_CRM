import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import {
  requireInvoiceAdmin,
  InvoiceInputSchema,
  firstZodMessage,
  buildInvoiceFields,
  getInvoiceSettings,
} from "@/lib/invoice/service";
import { renderInvoicePdf } from "@/lib/invoice/pdf";

export const runtime = "nodejs";

// POST: Render the unsaved invoice form as a draft PDF. Nothing is stored.
export async function POST(req: Request) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const parsed = InvoiceInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    await dbConnect();
    const settings = await getInvoiceSettings();
    const buffer = await renderInvoicePdf({
      ...buildInvoiceFields(parsed.data),
      status: "DRAFT",
      bank: settings.bank,
      sellerEmail: settings.sellerEmail,
      sellerPhone: settings.sellerPhone,
      signatoryName: settings.signatoryName,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="Invoice-Preview.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice Preview Error:", error);
    return NextResponse.json({ error: "Failed to build the preview" }, { status: 500 });
  }
}
