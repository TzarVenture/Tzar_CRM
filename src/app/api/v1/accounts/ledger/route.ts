import { NextResponse } from "next/server";
import { requireInvoiceAdmin } from "@/lib/invoice/service";
import { loadBooks } from "@/lib/accounts/service";
import { customerKey, customerStatement, customerSummaries, invoiceBalances } from "@/lib/accounts/ledger";

// GET /api/v1/accounts/ledger                 -> every customer with their balance
// GET /api/v1/accounts/ledger?customer=<key>  -> one customer's statement and open invoices
export async function GET(req: Request) {
  try {
    if (!(await requireInvoiceAdmin("accounts.ledger"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const key = new URL(req.url).searchParams.get("customer");
    const { invoices, payments } = await loadBooks();

    if (!key) return NextResponse.json({ customers: customerSummaries(invoices, payments) });

    const balances = invoiceBalances(invoices, payments).filter(
      (b) => customerKey(b.invoice.customerName, b.invoice.customerGstin) === key
    );
    return NextResponse.json({
      statement: customerStatement(key, invoices, payments),
      invoices: balances.map((b) => ({
        id: b.invoice.id,
        invoiceNumber: b.invoice.invoiceNumber,
        date: b.invoice.invoiceDate,
        total: b.invoice.totals.grandTotal,
        paid: b.paid,
        outstanding: b.outstanding,
      })),
    });
  } catch (error) {
    console.error("Ledger error:", error);
    return NextResponse.json({ error: "Failed to load ledger" }, { status: 500 });
  }
}
