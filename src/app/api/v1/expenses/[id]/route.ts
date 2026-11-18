import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { requireInvoiceAdmin, firstZodMessage } from "@/lib/invoice/service";
import { ExpenseInputSchema, buildExpenseFields } from "@/lib/expense/service";

type RouteContext = { params: Promise<{ id: string }> };

async function loadExpense(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  await dbConnect();
  return Expense.findById(id);
}

// PATCH: Edit an expense
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const expense = await loadExpense((await params).id);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const parsed = ExpenseInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    expense.set(buildExpenseFields(parsed.data));
    await expense.save();
    return NextResponse.json({ expense: expense.toObject() }, { status: 200 });
  } catch (error) {
    console.error("PATCH Expense Error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

// DELETE: Remove an expense
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const expense = await loadExpense((await params).id);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    await expense.deleteOne();
    return NextResponse.json({ status: "deleted" }, { status: 200 });
  } catch (error) {
    console.error("DELETE Expense Error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
