import { z } from "zod";
import { SELLER } from "@/lib/invoice/config";
import { checkGstin, gstinProblemMessage } from "@/lib/gst/gstin";
import { computeExpense } from "@/lib/expense/calc";
import {
  EXPENSE_BRANDS,
  EXPENSE_CATEGORIES,
  PAYMENT_MODES,
  RECURRING_OPTIONS,
} from "@/lib/expense/config";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const ExpenseInputSchema = z
  .object({
    expenseDate: z.string().regex(ISO_DATE, "Bill date is required"),
    brand: z.enum(EXPENSE_BRANDS).default("general"),
    category: z.enum(EXPENSE_CATEGORIES, { message: "Choose a category" }),
    vendorName: z.string().trim().min(1, "Vendor name is required").max(200),
    vendorGstin: z.string().trim().toUpperCase().optional().default(""),
    vendorStateCode: z.string().regex(/^\d{2}$/, "Vendor state is required"),
    billNumber: z.string().trim().max(60).optional().default(""),
    description: z.string().trim().max(500).optional().default(""),
    taxableValue: z.number().positive("Amount must be more than 0"),
    gstRate: z.number().min(0).max(40),
    itcEligible: z.boolean().optional().default(false),
    paymentMode: z.enum(PAYMENT_MODES).default("UPI"),
    paymentStatus: z.enum(["PAID", "UNPAID"]).default("PAID"),
    recurring: z.enum(RECURRING_OPTIONS).default("NONE"),
  })
  .superRefine((data, ctx) => {
    if (data.vendorGstin) {
      const problem = checkGstin(data.vendorGstin);
      if (problem) {
        ctx.addIssue({ code: "custom", path: ["vendorGstin"], message: gstinProblemMessage(problem, "Vendor GSTIN") });
      } else if (data.vendorGstin.slice(0, 2) !== data.vendorStateCode) {
        ctx.addIssue({
          code: "custom",
          path: ["vendorGstin"],
          message: "Vendor GSTIN state code does not match the selected state",
        });
      }
    }
    // Only a GST-registered vendor can charge GST, and credit needs their GSTIN on the bill
    if (!data.vendorGstin && data.gstRate > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["gstRate"],
        message: "Enter the vendor's GSTIN to record GST on this bill, or set GST to 0%",
      });
    }
    if (data.itcEligible && (!data.vendorGstin || data.gstRate === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["itcEligible"],
        message: "Input credit needs a vendor GSTIN and GST charged on the bill",
      });
    }
    if (new Date(`${data.expenseDate}T00:00:00.000Z`).getTime() > Date.now() + 24 * 3600 * 1000) {
      ctx.addIssue({ code: "custom", path: ["expenseDate"], message: "Bill date cannot be in the future" });
    }
  });

export type ExpenseInput = z.infer<typeof ExpenseInputSchema>;

/** Amounts are always recomputed on the server from the taxable value and rate. */
export function buildExpenseFields(input: ExpenseInput) {
  const amounts = computeExpense({
    taxableValue: input.taxableValue,
    gstRate: input.gstRate,
    vendorStateCode: input.vendorStateCode,
    ourStateCode: SELLER.stateCode,
  });

  return {
    expenseDate: new Date(`${input.expenseDate}T00:00:00.000Z`),
    brand: input.brand,
    category: input.category,
    vendorName: input.vendorName,
    vendorGstin: input.vendorGstin,
    vendorStateCode: input.vendorStateCode,
    billNumber: input.billNumber,
    description: input.description,
    gstRate: input.gstRate,
    itcEligible: input.itcEligible,
    paymentMode: input.paymentMode,
    paymentStatus: input.paymentStatus,
    recurring: input.recurring,
    ...amounts,
  };
}
