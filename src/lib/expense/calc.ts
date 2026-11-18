import { round2 } from "@/lib/invoice/calc";

export interface ExpenseAmounts {
  isInterState: boolean;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  total: number;
}

/**
 * GST on a purchase bill. A vendor in our own state charges CGST + SGST; a
 * vendor in another state charges IGST. Pure function, shared by the form's
 * live total and the server.
 */
export function computeExpense(input: {
  taxableValue: number;
  gstRate: number;
  vendorStateCode: string;
  ourStateCode: string;
}): ExpenseAmounts {
  const taxableValue = round2(Math.max(Number(input.taxableValue) || 0, 0));
  const gstRate = Math.max(Number(input.gstRate) || 0, 0);
  const isInterState = !!input.vendorStateCode && input.vendorStateCode !== input.ourStateCode;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (isInterState) {
    igst = round2((taxableValue * gstRate) / 100);
  } else {
    cgst = round2((taxableValue * gstRate) / 200);
    sgst = cgst;
  }
  const taxAmount = round2(cgst + sgst + igst);

  return {
    isInterState,
    taxableValue,
    cgst,
    sgst,
    igst,
    taxAmount,
    total: round2(taxableValue + taxAmount),
  };
}
