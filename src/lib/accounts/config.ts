export const RECEIPT_MODES = ["UPI", "Bank Transfer", "Cash", "Cheque", "Card"] as const;
export type ReceiptMode = (typeof RECEIPT_MODES)[number];
