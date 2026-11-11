import mongoose, { Schema, Document, Model } from "mongoose";

/** Single shared document (key "default") with the details printed on every invoice. */
export interface InvoiceSettingsData {
  sellerEmail?: string;
  sellerPhone?: string;
  signatoryName?: string;
  bank?: {
    accountName?: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    branch?: string;
    upiId?: string;
  };
  defaultTerms?: string;
  defaultNotes?: string;
}

export interface IInvoiceSettings extends InvoiceSettingsData, Document {
  key: string;
}

const InvoiceSettingsSchema: Schema<IInvoiceSettings> = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    sellerEmail: String,
    sellerPhone: String,
    signatoryName: String,
    bank: {
      accountName: String,
      bankName: String,
      accountNumber: String,
      ifsc: String,
      branch: String,
      upiId: String,
    },
    defaultTerms: String,
    defaultNotes: String,
  },
  { timestamps: true }
);

const InvoiceSettings: Model<IInvoiceSettings> =
  mongoose.models.InvoiceSettings ||
  mongoose.model<IInvoiceSettings>("InvoiceSettings", InvoiceSettingsSchema);

export default InvoiceSettings;
