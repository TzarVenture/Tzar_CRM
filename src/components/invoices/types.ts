import type { InvoiceBrand } from "@/lib/invoice/config";
import type { ComputedInvoiceItem, InvoiceTotals } from "@/lib/invoice/calc";

export interface InvoiceCustomerForm {
  name: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  stateCode: string;
  pincode: string;
}

export interface InvoiceRecord {
  _id: string;
  invoiceNumber?: string;
  brand: InvoiceBrand;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  invoiceDate: string;
  dueDate?: string;
  customer: Partial<InvoiceCustomerForm> & { name: string };
  placeOfSupplyCode?: string;
  items?: ComputedInvoiceItem[];
  pricesIncludeTax?: boolean;
  totals?: Partial<InvoiceTotals>;
  notes?: string;
  terms?: string;
}

export interface InvoiceSettingsForm {
  sellerEmail: string;
  sellerPhone: string;
  signatoryName: string;
  bank: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    branch: string;
    upiId: string;
  };
  defaultTerms: string;
  defaultNotes: string;
}

export interface SavedCustomer extends InvoiceCustomerForm {
  _id: string;
}

export interface CatalogItem {
  _id: string;
  brand: InvoiceBrand;
  description: string;
  hsnSac?: string;
  unit?: string;
  rate: number;
  gstRate: number;
}

export const inputClass =
  "w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white outline-none focus:border-slate-800";

export const labelClass = "block text-xs font-bold text-slate-700 mb-1";
