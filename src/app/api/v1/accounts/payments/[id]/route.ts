import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import { requireInvoiceAdmin } from "@/lib/invoice/service";

// DELETE /api/v1/accounts/payments/:id — remove a wrongly entered receipt
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireInvoiceAdmin("accounts.ledger"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    await dbConnect();
    const deleted = await Payment.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete payment error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
