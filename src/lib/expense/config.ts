/** Static options for the expense tracker. */

export const EXPENSE_CATEGORIES = [
  "Goods Purchased",
  "Packaging",
  "Software & Subscriptions",
  "Advertising & Marketing",
  "Courier & Logistics",
  "Rent",
  "Salaries & Freelancers",
  "Professional Fees",
  "Travel",
  "Office Supplies",
  "Utilities & Internet",
  "Bank & Payment Charges",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// "general" is for costs shared by the whole business, such as rent
export const EXPENSE_BRANDS = ["general", "tzar", "adshalaa", "crownleaf", "titepo"] as const;
export type ExpenseBrand = (typeof EXPENSE_BRANDS)[number];

export const EXPENSE_BRAND_LABELS: Record<ExpenseBrand, string> = {
  general: "General (whole business)",
  tzar: "Tzar Digital Agency",
  adshalaa: "Adshalaa Edutech",
  crownleaf: "Crownleaf Luxury Gifting",
  titepo: "Titepo",
};

export const PAYMENT_MODES = ["UPI", "Bank Transfer", "Card", "Cash", "Cheque"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const RECURRING_OPTIONS = ["NONE", "MONTHLY", "YEARLY"] as const;
export type RecurringOption = (typeof RECURRING_OPTIONS)[number];

export const RECURRING_LABELS: Record<RecurringOption, string> = {
  NONE: "One-time",
  MONTHLY: "Monthly subscription",
  YEARLY: "Yearly subscription",
};
