import mongoose, { Schema, Document, Model } from "mongoose";

import { RECEIPT_MODES, ReceiptMode } from "@/lib/accounts/config";

/** Money received from a customer against an issued tax invoice. */
export interface IPayment extends Document {
  invoice: mongoose.Types.ObjectId;
  brand: string;
  date: Date;
  amount: number;
  mode: ReceiptMode;
  reference?: string;
  notes?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    invoice: { type: Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    brand: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    mode: { type: String, enum: RECEIPT_MODES, default: "UPI" },
    reference: { type: String, trim: true },
    notes: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
