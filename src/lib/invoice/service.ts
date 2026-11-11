import { z } from "zod";
import { auth } from "@/lib/auth";
import type { IInvoice, InvoiceData } from "@/models/Invoice";
import InvoiceCounter from "@/models/InvoiceCounter";
import InvoiceSettings, { InvoiceSettingsData } from "@/models/InvoiceSettings";
import InvoiceCustomer from "@/models/InvoiceCustomer";
import InvoiceCatalogItem from "@/models/InvoiceCatalogItem";
import { computeInvoice } from "@/lib/invoice/calc";
import {
  SELLER,
  DEFAULT_BANK,
  GSTIN_REGEX,
  DEFAULT_INVOICE_TERMS,
  getFinancialYear,
  formatInvoiceNumber,
} from "@/lib/invoice/config";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Invoices are created by the owner only. */
export async function requireInvoiceAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "SUPER_ADMIN" && role !== "ADMIN")) return null;
  return session;
}

export const InvoiceInputSchema = z
  .object({
    brand: z.enum(["tzar", "adshalaa", "crownleaf", "titepo"]),
    invoiceDate: z.string().regex(ISO_DATE, "Invoice date is required"),
    dueDate: z.string().regex(ISO_DATE).or(z.literal("")).optional(),
    customer: z.object({
      name: z.string().trim().min(1, "Customer name is required"),
      gstin: z.string().trim().toUpperCase().optional().default(""),
      phone: z.string().trim().optional().default(""),
      email: z.string().trim().optional().default(""),
      address: z.string().trim().optional().default(""),
      city: z.string().trim().optional().default(""),
      stateCode: z.string().regex(/^\d{2}$/, "Customer state is required"),
      pincode: z.string().trim().optional().default(""),
    }),
    placeOfSupplyCode: z.string().regex(/^\d{2}$/).optional(),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1, "Item description is required"),
          details: z.string().trim().optional().default(""),
          hsnSac: z.string().trim().optional().default(""),
          quantity: z.number().positive("Quantity must be more than 0"),
          unit: z.string().trim().optional().default(""),
          rate: z.number().min(0),
          discountPercent: z.number().min(0).max(100).optional().default(0),
          gstRate: z.number().min(0).max(100),
        })
      )
      .min(1, "Add at least one item"),
    pricesIncludeTax: z.boolean().optional().default(false),
    notes: z.string().optional().default(""),
    terms: z.string().optional().default(""),
    action: z.enum(["draft", "issue"]).optional().default("draft"),
  })
  .superRefine((data, ctx) => {
    const gstin = data.customer.gstin;
    if (!gstin) return;
    if (!GSTIN_REGEX.test(gstin)) {
      ctx.addIssue({ code: "custom", path: ["customer", "gstin"], message: "GSTIN format is invalid" });
    } else if (gstin.slice(0, 2) !== data.customer.stateCode) {
      ctx.addIssue({
        code: "custom",
        path: ["customer", "gstin"],
        message: "GSTIN state code does not match the selected state",
      });
    }
  });

export type InvoiceInput = z.infer<typeof InvoiceInputSchema>;

/** First validation message, for showing in the form. */
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message || "Invalid invoice details";
}

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Totals are always recomputed on the server; amounts sent by the browser are ignored. */
export function buildInvoiceFields(input: InvoiceInput) {
  // Goods delivered in another state than the billing address are taxed by the delivery state
  const placeOfSupplyCode = input.placeOfSupplyCode || input.customer.stateCode;
  const computed = computeInvoice({
    items: input.items,
    pricesIncludeTax: input.pricesIncludeTax,
    sellerStateCode: SELLER.stateCode,
    customerStateCode: placeOfSupplyCode,
  });

  return {
    brand: input.brand,
    financialYear: getFinancialYear(input.invoiceDate),
    invoiceDate: utcDate(input.invoiceDate),
    dueDate: input.dueDate ? utcDate(input.dueDate) : undefined,
    customer: input.customer,
    placeOfSupplyCode,
    items: computed.items,
    pricesIncludeTax: input.pricesIncludeTax,
    isInterState: computed.isInterState,
    totals: computed.totals,
    amountInWords: computed.amountInWords,
    notes: input.notes,
    terms: input.terms,
  };
}

export async function getInvoiceSettings(): Promise<InvoiceSettingsData> {
  const doc = await InvoiceSettings.findOne({ key: "default" }).lean();
  return {
    sellerEmail: doc?.sellerEmail || "",
    sellerPhone: doc?.sellerPhone || "",
    signatoryName: doc?.signatoryName || SELLER.legalName,
    bank: {
      accountName: doc?.bank?.accountName || DEFAULT_BANK.accountName,
      bankName: doc?.bank?.bankName || DEFAULT_BANK.bankName,
      accountNumber: doc?.bank?.accountNumber || DEFAULT_BANK.accountNumber,
      ifsc: doc?.bank?.ifsc || DEFAULT_BANK.ifsc,
      branch: doc?.bank?.branch || DEFAULT_BANK.branch,
      upiId: doc?.bank?.upiId || DEFAULT_BANK.upiId,
    },
    defaultTerms: doc?.defaultTerms ?? DEFAULT_INVOICE_TERMS,
    defaultNotes: doc?.defaultNotes || "",
  };
}

async function nextSequence(key: string): Promise<number> {
  const inc = () =>
    InvoiceCounter.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  try {
    return (await inc())!.seq;
  } catch (err: unknown) {
    // Two first-ever upserts for the same key can race; the retry hits the existing counter
    if ((err as { code?: number })?.code === 11000) return (await inc())!.seq;
    throw err;
  }
}

/** Assigns the next number, freezes seller/bank details and locks the invoice. */
export async function issueInvoice(invoice: IInvoice): Promise<IInvoice> {
  if (invoice.status !== "DRAFT") throw new Error("Only a draft can be issued");

  const settings = await getInvoiceSettings();
  const seq = await nextSequence(`${invoice.brand}:${invoice.financialYear}`);

  invoice.invoiceNumber = formatInvoiceNumber(invoice.brand, invoice.financialYear, seq);
  invoice.status = "ISSUED";
  invoice.issuedAt = new Date();
  invoice.bank = settings.bank;
  invoice.sellerEmail = settings.sellerEmail;
  invoice.sellerPhone = settings.sellerPhone;
  invoice.signatoryName = settings.signatoryName;
  await invoice.save();

  await rememberCustomerAndItems(invoice);
  return invoice;
}

/** Feeds the auto-fill suggestions. Never allowed to fail the invoice itself. */
async function rememberCustomerAndItems(invoice: IInvoice) {
  try {
    const c = invoice.customer;
    await InvoiceCustomer.updateOne(
      { nameKey: c.name.trim().toLowerCase() },
      {
        $set: {
          name: c.name,
          gstin: c.gstin,
          phone: c.phone,
          email: c.email,
          address: c.address,
          city: c.city,
          stateCode: c.stateCode,
          pincode: c.pincode,
        },
      },
      { upsert: true }
    );

    for (const item of invoice.items) {
      await InvoiceCatalogItem.updateOne(
        { brand: invoice.brand, descriptionKey: item.description.trim().toLowerCase() },
        {
          $set: {
            description: item.description,
            hsnSac: item.hsnSac,
            unit: item.unit,
            rate: item.rate,
            gstRate: item.gstRate,
          },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Invoice suggestions update failed:", err);
  }
}

/**
 * Plain object handed to the PDF/DOCX renderers. Issued invoices use the
 * details frozen at issue time; drafts preview with the current settings.
 */
export async function toRenderableInvoice(invoice: IInvoice): Promise<InvoiceData> {
  const data = invoice.toObject() as InvoiceData;
  if (invoice.status !== "DRAFT") return data;
  const settings = await getInvoiceSettings();
  return {
    ...data,
    bank: settings.bank,
    sellerEmail: settings.sellerEmail,
    sellerPhone: settings.sellerPhone,
    signatoryName: settings.signatoryName,
  };
}
