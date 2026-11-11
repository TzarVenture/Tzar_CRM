import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Invoice from "@/models/Invoice";
import {
  requireInvoiceAdmin,
  InvoiceInputSchema,
  firstZodMessage,
  buildInvoiceFields,
  issueInvoice,
} from "@/lib/invoice/service";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET: List invoices (newest first) with optional brand / status / search filters
export async function GET(req: Request) {
  try {
    const session = await requireInvoiceAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (brand && brand !== "all") filter.brand = brand;
    if (status && status !== "all") filter.status = status;
    if (search) {
      const rx = { $regex: escapeRegex(search), $options: "i" };
      filter.$or = [{ invoiceNumber: rx }, { "customer.name": rx }, { "customer.phone": rx }];
    }

    await dbConnect();
    const invoices = await Invoice.find(filter)
      .select("invoiceNumber brand status invoiceDate dueDate customer.name totals.grandTotal createdAt")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST: Create an invoice as a draft, or create and issue it in one step
export async function POST(req: Request) {
  try {
    const session = await requireInvoiceAdmin();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const parsed = InvoiceInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: firstZodMessage(parsed.error) }, { status: 400 });
    }

    await dbConnect();
    const invoice = await Invoice.create({
      ...buildInvoiceFields(parsed.data),
      status: "DRAFT",
      createdBy: session.user.id,
    });

    if (parsed.data.action === "issue") {
      await issueInvoice(invoice);
    }

    return NextResponse.json({ invoice: invoice.toObject() }, { status: 201 });
  } catch (error) {
    console.error("POST Invoice Error:", error);
    return NextResponse.json({ error: "Failed to save invoice" }, { status: 500 });
  }
}
