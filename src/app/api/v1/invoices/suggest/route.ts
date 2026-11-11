import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import InvoiceCustomer from "@/models/InvoiceCustomer";
import InvoiceCatalogItem from "@/models/InvoiceCatalogItem";
import { requireInvoiceAdmin } from "@/lib/invoice/service";

// GET: Saved customers and catalogue items used to auto-fill the invoice form
export async function GET() {
  try {
    if (!(await requireInvoiceAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await dbConnect();
    const [customers, items] = await Promise.all([
      InvoiceCustomer.find().select("-nameKey -__v").sort({ updatedAt: -1 }).limit(500).lean(),
      InvoiceCatalogItem.find().select("-descriptionKey -__v").sort({ updatedAt: -1 }).limit(1000).lean(),
    ]);
    return NextResponse.json({ customers, items }, { status: 200 });
  } catch (error) {
    console.error("GET Invoice Suggestions Error:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
