import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * One running sequence per brand per financial year (key e.g. "tzar:26-27").
 * Incremented atomically with $inc so two invoices can never share a number.
 */
export interface IInvoiceCounter extends Document {
  key: string;
  seq: number;
}

const InvoiceCounterSchema: Schema<IInvoiceCounter> = new Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const InvoiceCounter: Model<IInvoiceCounter> =
  mongoose.models.InvoiceCounter ||
  mongoose.model<IInvoiceCounter>("InvoiceCounter", InvoiceCounterSchema);

export default InvoiceCounter;
