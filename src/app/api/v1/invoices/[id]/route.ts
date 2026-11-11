import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import {
  requireInvoiceAdmin,
  InvoiceInputSchema,
  firstZodMessage,
  buildInvoiceFields,
  issueInvoice,
} from "@/lib/invoice/service";

type RouteContext = { params: Promise<{ id: string }> };

async function loadInvoice(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  return Invoice.findById(id);
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const invoice = await loadInvoice((await params).id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    return NextResponse.json({ invoice: invoice.toObject() }, { status: 200 });
  } catch (error) {
    console.error("GET Invoice Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PATCH: Edit a draft (optionally issuing it), or cancel an issued invoice
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const invoice = await loadInvoice((await params).id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const body = await req.json();

    if (body?.action === "cancel") {
      if (invoice.status !== "ISSUED") {
        return NextResponse.json({ error: "Only an issued invoice can be cancelled" }, { status: 409 });
      }
      // The number stays used, so the series has no gap and the record is kept
      invoice.status = "CANCELLED";
      invoice.cancelledAt = new Date();
      invoice.cancelReason = String(body.reason || "").slice(0, 300);
      await invoice.save();
      return NextResponse.json({ invoice: invoice.toObject() }, { status: 200 });
    }

    if (invoice.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Issued invoices are locked. Cancel it and create a new one instead." },
        { status: 409 }
      );
    }

    const parsed = InvoiceInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    invoice.set(buildInvoiceFields(parsed.data));
    await invoice.save();

    if (parsed.data.action === "issue") {
      await issueInvoice(invoice);
    }

    return NextResponse.json({ invoice: invoice.toObject() }, { status: 200 });
  } catch (error) {
    console.error("PATCH Invoice Error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE: Drafts only. Issued invoices are legal records and can only be cancelled.
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const invoice = await loadInvoice((await params).id);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status !== "DRAFT") {
      return NextResponse.json({ error: "Only drafts can be deleted" }, { status: 409 });
    }
    await invoice.deleteOne();
    return NextResponse.json({ status: "deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Invoice Error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
