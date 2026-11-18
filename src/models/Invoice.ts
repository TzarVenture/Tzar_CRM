import mongoose, { Schema, Document, Model } from "mongoose";
import type { InvoiceBrand, InvoiceDocumentType } from "@/lib/invoice/config";
import type { ComputedInvoiceItem, InvoiceTotals } from "@/lib/invoice/calc";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "CANCELLED";

export interface InvoiceCustomerDetails {
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  stateCode: string;
  pincode?: string;
}

/** Consignee, when the goods go somewhere other than the billing address. */
export interface InvoiceShipTo {
  name?: string;
  gstin?: string;
  address?: string;
  city?: string;
  stateCode?: string;
  pincode?: string;
}

/** Optional order and dispatch references printed in the invoice header grid. */
export interface InvoiceReferences {
  paymentTerms?: string;
  referenceNo?: string;
  otherReferences?: string;
  buyerOrderNo?: string;
  buyerOrderDate?: string;
  deliveryNote?: string;
  deliveryNoteDate?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
}

export interface InvoiceBankDetails {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branch?: string;
  upiId?: string;
}

export interface InvoiceData {
  invoiceNumber?: string;
  brand: InvoiceBrand;
  // Missing on invoices saved before proformas existed; treat as TAX_INVOICE
  documentType?: InvoiceDocumentType;
  status: InvoiceStatus;
  financialYear: string;
  invoiceDate: Date;
  dueDate?: Date;
  customer: InvoiceCustomerDetails;
  shipTo?: InvoiceShipTo;
  references?: InvoiceReferences;
  // State where the goods/services are delivered; decides CGST+SGST vs IGST
  placeOfSupplyCode: string;
  items: ComputedInvoiceItem[];
  pricesIncludeTax: boolean;
  isInterState: boolean;
  totals: InvoiceTotals;
  amountInWords: string;
  notes?: string;
  terms?: string;
  // Frozen at issue time so later settings changes never alter an issued invoice
  bank?: InvoiceBankDetails;
  sellerEmail?: string;
  sellerPhone?: string;
  signatoryName?: string;
  createdBy?: mongoose.Types.ObjectId;
  issuedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

export interface IInvoice extends InvoiceData, Document {
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    // Assigned only when issued; drafts leave it unset so the sparse unique index ignores them
    invoiceNumber: { type: String, unique: true, sparse: true },
    brand: {
      type: String,
      enum: ["tzar", "adshalaa", "crownleaf", "titepo"],
      required: true,
      index: true,
    },
    documentType: { type: String, enum: ["TAX_INVOICE", "PROFORMA"], default: "TAX_INVOICE" },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "CANCELLED"],
      default: "DRAFT",
      required: true,
      index: true,
    },
    financialYear: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date },
    customer: {
      name: { type: String, required: true, trim: true },
      gstin: { type: String, uppercase: true, trim: true },
      phone: String,
      email: { type: String, lowercase: true, trim: true },
      address: String,
      city: String,
      stateCode: { type: String, required: true },
      pincode: String,
    },
    shipTo: {
      name: String,
      gstin: { type: String, uppercase: true, trim: true },
      address: String,
      city: String,
      stateCode: String,
      pincode: String,
    },
    references: {
      paymentTerms: String,
      referenceNo: String,
      otherReferences: String,
      buyerOrderNo: String,
      buyerOrderDate: String,
      deliveryNote: String,
      deliveryNoteDate: String,
      dispatchDocNo: String,
      dispatchedThrough: String,
      destination: String,
      termsOfDelivery: String,
    },
    placeOfSupplyCode: { type: String, required: true },
    items: [
      {
        _id: false,
        description: { type: String, required: true },
        details: String,
        hsnSac: String,
        quantity: { type: Number, required: true },
        unit: String,
        rate: { type: Number, required: true },
        discountPercent: { type: Number, default: 0 },
        gstRate: { type: Number, required: true },
        taxableValue: Number,
        cgst: Number,
        sgst: Number,
        igst: Number,
        taxAmount: Number,
        lineTotal: Number,
      },
    ],
    pricesIncludeTax: { type: Boolean, default: false },
    isInterState: { type: Boolean, default: false },
    totals: {
      discount: Number,
      taxableValue: Number,
      cgst: Number,
      sgst: Number,
      igst: Number,
      totalTax: Number,
      roundOff: Number,
      grandTotal: Number,
    },
    amountInWords: String,
    notes: String,
    terms: String,
    bank: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branch: String,
      upiId: String,
    },
    sellerEmail: String,
    sellerPhone: String,
    signatoryName: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    issuedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
  },
  { timestamps: true }
);

InvoiceSchema.index({ brand: 1, invoiceDate: -1 });
InvoiceSchema.index({ createdAt: -1 });

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
