import mongoose, { Schema, Document, Model } from "mongoose";

/** Products and services remembered per brand from past invoices. */
export interface IInvoiceCatalogItem extends Document {
  brand: string;
  descriptionKey: string;
  description: string;
  hsnSac?: string;
  unit?: string;
  rate: number;
  gstRate: number;
}

const InvoiceCatalogItemSchema: Schema<IInvoiceCatalogItem> = new Schema(
  {
    brand: { type: String, required: true },
    descriptionKey: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    hsnSac: String,
    unit: String,
    rate: { type: Number, default: 0 },
    gstRate: { type: Number, default: 18 },
  },
  { timestamps: true }
);

InvoiceCatalogItemSchema.index({ brand: 1, descriptionKey: 1 }, { unique: true });

const InvoiceCatalogItem: Model<IInvoiceCatalogItem> =
  mongoose.models.InvoiceCatalogItem ||
  mongoose.model<IInvoiceCatalogItem>("InvoiceCatalogItem", InvoiceCatalogItemSchema);

export default InvoiceCatalogItem;
