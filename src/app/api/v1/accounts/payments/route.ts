import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";
import { RECEIPT_MODES } from "@/lib/accounts/config";
import { requireInvoiceAdmin, firstZodMessage } from "@/lib/invoice/service";
import { round2 } from "@/lib/invoice/calc";

const PaymentSchema = z.object({
  invoiceId: z.string().refine((v) => mongoose.isValidObjectId(v), "Choose an invoice"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  amount: z.number().positive("Amount must be more than zero"),
  mode: z.enum(RECEIPT_MODES),
  reference: z.string().trim().max(100).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

// POST /api/v1/accounts/payments  — record money received against an issued tax invoice
export async function POST(req: Request) {
  try {
    const session = await requireInvoiceAdmin("accounts.ledger");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const parsed = PaymentSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    const input = parsed.data;

    const date = new Date(`${input.date}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 24 * 3600 * 1000) {
      return NextResponse.json({ error: "Payment date cannot be in the future" }, { status: 400 });
    }

    await dbConnect();
    const invoice = await Invoice.findById(input.invoiceId);
    if (!invoice || invoice.status !== "ISSUED" || (invoice.documentType || "TAX_INVOICE") !== "TAX_INVOICE") {
      return NextResponse.json({ error: "Payments can only be recorded against issued tax invoices" }, { status: 400 });
    }
    if (date < invoice.invoiceDate) {
      return NextResponse.json({ error: "Payment date cannot be before the invoice date" }, { status: 400 });
    }

    const agg = await Payment.aggregate([
      { $match: { invoice: invoice._id } },
      { $group: { _id: null, paid: { $sum: "$amount" } } },
    ]);
    const outstanding = round2(invoice.totals.grandTotal - (agg[0]?.paid || 0));
    const amount = round2(input.amount);
    if (amount > outstanding) {
      return NextResponse.json({ error: `Amount is more than the ₹${outstanding.toFixed(2)} outstanding on this invoice` }, { status: 400 });
    }

    const payment = await Payment.create({
      invoice: invoice._id,
      brand: invoice.brand,
      date,
      amount,
      mode: input.mode,
      reference: input.reference || undefined,
      notes: input.notes || undefined,
      createdBy: session.user?.id,
    });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
