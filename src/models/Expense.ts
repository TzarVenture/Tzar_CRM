import mongoose, { Schema, Document, Model } from "mongoose";
import {
  EXPENSE_BRANDS,
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  RECURRING_OPTIONS,
  ExpenseBrand,
  ExpenseCategory,
  PaymentMode,
  RecurringOption,
} from "@/lib/expense/config";

export interface IExpense extends Document {
  expenseDate: Date;
  brand: ExpenseBrand;
  category: ExpenseCategory;
  vendorName: string;
  vendorGstin?: string;
  vendorStateCode: string;
  billNumber?: string;
  description?: string;
  taxableValue: number;
  gstRate: number;
  isInterState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  total: number;
  // Input tax credit: GST on this bill that can be set off against GST collected
  itcEligible: boolean;
  paymentMode: PaymentMode;
  paymentStatus: "PAID" | "UNPAID";
  recurring: RecurringOption;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema<IExpense> = new Schema(
  {
    expenseDate: { type: Date, required: true, index: true },
    brand: { type: String, enum: EXPENSE_BRANDS, default: "general", required: true, index: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true, index: true },
    vendorName: { type: String, required: true, trim: true },
    vendorGstin: { type: String, uppercase: true, trim: true },
    vendorStateCode: { type: String, required: true },
    billNumber: { type: String, trim: true },
    description: String,
    taxableValue: { type: Number, required: true },
    gstRate: { type: Number, default: 0 },
    isInterState: { type: Boolean, default: false },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    itcEligible: { type: Boolean, default: false },
    paymentMode: { type: String, enum: PAYMENT_MODES, default: "UPI" },
    paymentStatus: { type: String, enum: ["PAID", "UNPAID"], default: "PAID" },
    recurring: { type: String, enum: RECURRING_OPTIONS, default: "NONE" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ExpenseSchema.index({ expenseDate: -1, createdAt: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
