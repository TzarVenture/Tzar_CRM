/** Plain shapes the accounting functions work on (decoupled from Mongoose). */
export interface AccInvoice {
  id: string;
  invoiceNumber: string;
  brand: string;
  invoiceDate: Date;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  documentType: "TAX_INVOICE" | "PROFORMA";
  customerName: string;
  customerGstin?: string;
  customerStateCode: string;
  placeOfSupplyCode: string;
  isInterState: boolean;
  items: {
    hsnSac?: string;
    unit?: string;
    quantity: number;
    gstRate: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
  }[];
  totals: { taxableValue: number; cgst: number; sgst: number; igst: number; roundOff: number; grandTotal: number };
}

export interface AccPayment {
  id: string;
  invoiceId: string;
  date: Date;
  amount: number;
  mode: string;
  reference?: string;
}

export interface AccExpense {
  id: string;
  expenseDate: Date;
  brand: string;
  category: string;
  vendorName: string;
  vendorGstin?: string;
  billNumber?: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  itcEligible: boolean;
}

/** Only issued tax invoices count as sales. Proformas, drafts and cancelled documents do not. */
export function isSale(inv: AccInvoice): boolean {
  return inv.status === "ISSUED" && inv.documentType === "TAX_INVOICE";
}
