import mongoose, { Schema, Document, Model } from "mongoose";

/** Customers remembered from past invoices, used to auto-fill the invoice form. */
export interface IInvoiceCustomer extends Document {
  nameKey: string;
  name: string;
  gstin?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  stateCode: string;
  pincode?: string;
}

const InvoiceCustomerSchema: Schema<IInvoiceCustomer> = new Schema(
  {
    // Lower-cased name, so "Acme Pvt Ltd" and "acme pvt ltd" are one customer
    nameKey: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    gstin: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    stateCode: { type: String, required: true },
    pincode: String,
  },
  { timestamps: true }
);

const InvoiceCustomer: Model<IInvoiceCustomer> =
  mongoose.models.InvoiceCustomer ||
  mongoose.model<IInvoiceCustomer>("InvoiceCustomer", InvoiceCustomerSchema);

export default InvoiceCustomer;
