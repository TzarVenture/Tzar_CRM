import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import InvoiceCounter from "@/models/InvoiceCounter";
import { requireInvoiceAdmin } from "@/lib/invoice/service";
import {
  INVOICE_BRANDS,
  InvoiceBrand,
  getFinancialYear,
  formatInvoiceNumber,
} from "@/lib/invoice/config";

// GET: The number the next issued invoice would get for a brand and date.
// Read-only: the counter only moves when an invoice is actually issued.
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const brand = searchParams.get("brand") as InvoiceBrand;
    const date = searchParams.get("date") || "";
    if (!INVOICE_BRANDS.includes(brand) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid brand or date" }, { status: 400 });
    }

    await dbConnect();
    const fy = getFinancialYear(date);
    const counter = await InvoiceCounter.findOne({ key: `${brand}:${fy}` }).lean();

    return NextResponse.json(
      { number: formatInvoiceNumber(brand, fy, (counter?.seq || 0) + 1) },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET Next Invoice Number Error:", error);
    return NextResponse.json({ error: "Failed to get next invoice number" }, { status: 500 });
  }
}
