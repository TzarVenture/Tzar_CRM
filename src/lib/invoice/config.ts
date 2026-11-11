/**
 * Static invoice configuration. All four brands invoice under one GST
 * registration (a proprietorship), so the seller block is the same on every
 * invoice and the brand only changes the logo, heading and number prefix.
 */

export type InvoiceBrand = "tzar" | "adshalaa" | "crownleaf" | "titepo";

export const INVOICE_BRANDS: InvoiceBrand[] = ["tzar", "adshalaa", "crownleaf", "titepo"];

// As printed on the GST registration certificate.
export const SELLER = {
  legalName: "Rahul Rastogi",
  tradeName: "Tzar Digital Agency",
  gstin: "27ASYPR9821N1ZF",
  pan: "ASYPR9821N",
  addressLines: [
    "B, Ground Floor, Saki Vihar Road, behind Finch Restaurant",
    "Ganesh Nagar, Marol, Andheri East",
    "Mumbai, Maharashtra - 400072",
  ],
  stateCode: "27",
  stateName: "Maharashtra",
} as const;

// Printed under "Payment Details" unless overridden in Invoice Settings.
export const DEFAULT_BANK = {
  accountName: "Tzar Digital Agency",
  bankName: "Kotak Mahindra Bank",
  accountNumber: "2545306876",
  ifsc: "KKBK0001363",
  branch: "",
  upiId: "tzarventure@kotak",
} as const;

export interface BrandInvoiceConfig {
  name: string;
  tagline: string;
  website: string;
  /** Shown under the logo for brands that trade under the parent business. */
  byline?: string;
  /** Brand-specific terms; brands without them use the terms from Invoice Settings. */
  defaultTerms?: string;
  prefix: string;
  logoFile: string;
  logoWidth: number;
  logoHeight: number;
  accent: string;
  defaultHsnSac: string;
  defaultGstRate: number;
  defaultUnit: string;
}

const GOODS_TERMS =
  "1. Goods once sold will not be taken back or exchanged.\n2. All disputes are subject to Mumbai jurisdiction only.";

// HSN/SAC and GST defaults are only pre-fills for a new line; each line stays editable.
export const BRAND_CONFIG: Record<InvoiceBrand, BrandInvoiceConfig> = {
  tzar: {
    name: "Tzar Digital Agency",
    tagline: "Digital Marketing, Web & Creative Services",
    website: "www.tzar.co",
    prefix: "TZ",
    logoFile: "invoice-logo-tzar.png",
    logoWidth: 582,
    logoHeight: 90,
    accent: "#0D4733",
    defaultHsnSac: "998361",
    defaultGstRate: 18,
    defaultUnit: "NOS",
  },
  adshalaa: {
    name: "Adshalaa Edutech",
    tagline: "Online & Offline Professional Courses",
    website: "www.adshalaa.com",
    byline: "By Tzar Digital",
    prefix: "AD",
    logoFile: "adshalaa-logo.png",
    logoWidth: 288,
    logoHeight: 50,
    accent: "#B45309",
    defaultHsnSac: "999293",
    defaultGstRate: 18,
    defaultUnit: "NOS",
  },
  crownleaf: {
    name: "Crownleaf Luxury Gifting",
    tagline: "Luxury & Corporate Gifting",
    website: "www.crownleaf.co",
    byline: "By Tzar Digital",
    defaultTerms: GOODS_TERMS,
    prefix: "CL",
    logoFile: "invoice-logo-crownleaf.png",
    logoWidth: 1003,
    logoHeight: 254,
    accent: "#B8730F",
    defaultHsnSac: "",
    defaultGstRate: 18,
    defaultUnit: "PCS",
  },
  titepo: {
    name: "Titepo",
    tagline: "Kids Toys & Return Gifts",
    website: "www.titepo.com",
    byline: "By Tzar Digital",
    defaultTerms: GOODS_TERMS,
    prefix: "TP",
    logoFile: "titepo-logo.png",
    logoWidth: 362,
    logoHeight: 125,
    accent: "#0F3B2E",
    defaultHsnSac: "9503",
    defaultGstRate: 18,
    defaultUnit: "PCS",
  },
};

export const GST_RATES = [0, 5, 12, 18, 28, 40];

export const UNITS = ["NOS", "PCS", "SET", "BOX", "HRS", "DAYS", "MON", "KGS"];

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

export function stateName(code: string): string {
  return INDIAN_STATES.find((s) => s.code === code)?.name || "";
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Indian financial year (April to March) for a YYYY-MM-DD date, e.g. "26-27". */
export function getFinancialYear(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

/** e.g. TZ/26-27/0001. Stays within the 16-character GST limit. */
export function formatInvoiceNumber(brand: InvoiceBrand, fy: string, seq: number): string {
  return `${BRAND_CONFIG[brand].prefix}/${fy}/${String(seq).padStart(4, "0")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Invoice dates are stored at UTC midnight, so format with UTC getters. */
export function formatInvoiceDate(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function toIsoDate(value: string | Date | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export const DEFAULT_INVOICE_TERMS =
  "1. Payment is due by the due date mentioned on this invoice.\n2. Please quote the invoice number with your payment.";
