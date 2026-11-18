import type { InvoiceBrand, InvoiceDocumentType } from "@/lib/invoice/config";
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

export interface InvoiceShipToForm {
  name: string;
  gstin: string;
  address: string;
  city: string;
  stateCode: string;
  pincode: string;
}

export interface InvoiceReferencesForm {
  paymentTerms: string;
  referenceNo: string;
  otherReferences: string;
  buyerOrderNo: string;
  buyerOrderDate: string;
  deliveryNote: string;
  deliveryNoteDate: string;
  dispatchDocNo: string;
  dispatchedThrough: string;
  destination: string;
  termsOfDelivery: string;
}

export interface InvoiceRecord {
  _id: string;
  invoiceNumber?: string;
  brand: InvoiceBrand;
  documentType?: InvoiceDocumentType;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  invoiceDate: string;
  dueDate?: string;
  customer: Partial<InvoiceCustomerForm> & { name: string };
  shipTo?: Partial<InvoiceShipToForm>;
  references?: Partial<InvoiceReferencesForm>;
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
  "w-full px-3 py-2.5 text-sm font-medium rounded-xl border border-slate-300 bg-white outline-none focus:border-slate-800";

export const labelClass = "block text-sm font-semibold text-slate-700 mb-1";
