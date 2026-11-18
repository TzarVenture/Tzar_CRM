import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import { requireInvoiceAdmin, toRenderableInvoice } from "@/lib/invoice/service";
import { renderInvoicePdf } from "@/lib/invoice/pdf";

// The renderers read font and logo files from disk, which needs the Node.js runtime
export const runtime = "nodejs";

// GET /api/v1/invoices/:id/download
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await dbConnect();
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const data = await toRenderableInvoice(invoice);
    const buffer = await renderInvoicePdf(data);

    // Invoice numbers contain "/", which is not allowed in file names
    const baseName = (invoice.invoiceNumber || `Draft-${id.slice(-6)}`).replace(/\//g, "-");

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${baseName}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice Download Error:", error);
    return NextResponse.json({ error: "Failed to generate invoice file" }, { status: 500 });
  }
}
