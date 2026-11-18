import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { requireInvoiceAdmin, firstZodMessage } from "@/lib/invoice/service";
import { ExpenseInputSchema, buildExpenseFields } from "@/lib/expense/service";
import { round2 } from "@/lib/invoice/calc";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET: Expenses in a date range, with totals and the list of known vendors
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin("accounts.expenses"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const brand = searchParams.get("brand");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (ISO_DATE.test(from) || ISO_DATE.test(to)) {
      filter.expenseDate = {};
      if (ISO_DATE.test(from)) filter.expenseDate.$gte = new Date(`${from}T00:00:00.000Z`);
      if (ISO_DATE.test(to)) filter.expenseDate.$lte = new Date(`${to}T23:59:59.999Z`);
    }
    if (brand && brand !== "all") filter.brand = brand;
    if (category && category !== "all") filter.category = category;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ vendorName: rx }, { billNumber: rx }, { description: rx }];
    }

    await dbConnect();
    const [expenses, vendors] = await Promise.all([
      Expense.find(filter).sort({ expenseDate: -1, createdAt: -1 }).limit(1000).lean(),
      // Latest details per vendor, used to auto-fill the form
      Expense.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: { $toLower: "$vendorName" },
            vendorName: { $first: "$vendorName" },
            vendorGstin: { $first: "$vendorGstin" },
            vendorStateCode: { $first: "$vendorStateCode" },
            category: { $first: "$category" },
            gstRate: { $first: "$gstRate" },
            brand: { $first: "$brand" },
            recurring: { $first: "$recurring" },
          },
        },
        { $limit: 500 },
      ]),
    ]);

    const byCategory: Record<string, number> = {};
    const summary = { total: 0, taxableValue: 0, gstPaid: 0, itc: 0, unpaid: 0, count: expenses.length };
    for (const e of expenses) {
      summary.total = round2(summary.total + e.total);
      summary.taxableValue = round2(summary.taxableValue + e.taxableValue);
      summary.gstPaid = round2(summary.gstPaid + e.taxAmount);
      if (e.itcEligible) summary.itc = round2(summary.itc + e.taxAmount);
      if (e.paymentStatus === "UNPAID") summary.unpaid = round2(summary.unpaid + e.total);
      byCategory[e.category] = round2((byCategory[e.category] || 0) + e.total);
    }

    return NextResponse.json({ expenses, vendors, summary, byCategory }, { status: 200 });
  } catch (error) {
    console.error("GET Expenses Error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// POST: Record an expense
export async function POST(req: Request) {
  try {
    const session = await requireInvoiceAdmin("accounts.expenses");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const parsed = ExpenseInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    await dbConnect();

    // The same bill number from the same vendor is almost always a double entry
    if (parsed.data.billNumber) {
      const duplicate = await Expense.exists({
        billNumber: parsed.data.billNumber,
        vendorName: { $regex: `^${escapeRegex(parsed.data.vendorName)}$`, $options: "i" },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Bill ${parsed.data.billNumber} from ${parsed.data.vendorName} is already recorded` },
          { status: 409 }
        );
      }
    }

    const expense = await Expense.create({
      ...buildExpenseFields(parsed.data),
      createdBy: session.user.id,
    });

    return NextResponse.json({ expense: expense.toObject() }, { status: 201 });
  } catch (error) {
    console.error("POST Expense Error:", error);
    return NextResponse.json({ error: "Failed to save expense" }, { status: 500 });
  }
}
