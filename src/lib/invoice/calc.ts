/**
 * Pure GST invoice maths. No database or framework imports, so the same code
 * runs in the browser (live preview) and on the server (source of truth).
 */

export interface InvoiceItemInput {
  description: string;
  details?: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discountPercent?: number;
  gstRate: number;
}

export interface ComputedInvoiceItem extends InvoiceItemInput {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  discount: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
}

export interface ComputedInvoice {
  isInterState: boolean;
  items: ComputedInvoiceItem[];
  totals: InvoiceTotals;
  amountInWords: string;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Intra-state supply (customer in the seller's state) splits tax into equal
 * CGST + SGST; inter-state supply charges the whole rate as IGST.
 */
export function computeInvoice(input: {
  items: InvoiceItemInput[];
  pricesIncludeTax: boolean;
  sellerStateCode: string;
  customerStateCode: string;
}): ComputedInvoice {
  const isInterState =
    !!input.customerStateCode && input.customerStateCode !== input.sellerStateCode;

  const totals: InvoiceTotals = {
    discount: 0,
    taxableValue: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    totalTax: 0,
    roundOff: 0,
    grandTotal: 0,
  };

  const items = input.items.map((raw) => {
    const quantity = num(raw.quantity);
    const rate = num(raw.rate);
    const discountPercent = Math.min(Math.max(num(raw.discountPercent), 0), 100);
    const gstRate = Math.max(num(raw.gstRate), 0);

    const gross = round2(quantity * rate);
    const discount = round2((gross * discountPercent) / 100);
    const net = round2(gross - discount);

    let taxableValue: number;
    let taxAmount: number;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (input.pricesIncludeTax) {
      taxableValue = round2(net / (1 + gstRate / 100));
      taxAmount = round2(net - taxableValue);
      if (isInterState) {
        igst = taxAmount;
      } else {
        cgst = round2(taxAmount / 2);
        sgst = round2(taxAmount - cgst);
      }
    } else {
      taxableValue = net;
      if (isInterState) {
        igst = round2((taxableValue * gstRate) / 100);
      } else {
        cgst = round2((taxableValue * gstRate) / 200);
        sgst = cgst;
      }
      taxAmount = round2(cgst + sgst + igst);
    }

    const lineTotal = round2(taxableValue + taxAmount);

    totals.discount = round2(totals.discount + discount);
    totals.taxableValue = round2(totals.taxableValue + taxableValue);
    totals.cgst = round2(totals.cgst + cgst);
    totals.sgst = round2(totals.sgst + sgst);
    totals.igst = round2(totals.igst + igst);

    return {
      ...raw,
      quantity,
      rate,
      discountPercent,
      gstRate,
      taxableValue,
      cgst,
      sgst,
      igst,
      taxAmount,
      lineTotal,
    };
  });

  totals.totalTax = round2(totals.cgst + totals.sgst + totals.igst);
  const exact = round2(totals.taxableValue + totals.totalTax);
  totals.grandTotal = Math.round(exact);
  totals.roundOff = round2(totals.grandTotal - exact);

  return {
    isInterState,
    items,
    totals,
    amountInWords: amountInWords(totals.grandTotal),
  };
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
  "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} Hundred` : "", rest ? belowHundred(rest) : ""]
    .filter(Boolean)
    .join(" ");
}

/** Indian numbering system: crore, lakh, thousand. */
function integerInWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${integerInWords(crore)} Crore` : "",
    lakh ? `${belowHundred(lakh)} Lakh` : "",
    thousand ? `${belowHundred(thousand)} Thousand` : "",
    rest ? belowThousand(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function amountInWords(amount: number): string {
  const safe = Math.max(round2(amount), 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  const paisePart = paise ? ` and ${belowHundred(paise)} Paise` : "";
  return `Rupees ${integerInWords(rupees)}${paisePart} Only`;
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
}
