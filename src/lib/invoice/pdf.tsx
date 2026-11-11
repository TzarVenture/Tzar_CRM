import path from "path";
import { readFile } from "fs/promises";
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { InvoiceData } from "@/models/Invoice";
import { formatINR } from "@/lib/invoice/calc";
import { SELLER, BRAND_CONFIG, stateName, formatInvoiceDate } from "@/lib/invoice/config";

const FONT_DIR = path.join(process.cwd(), "src", "assets", "invoice-fonts");

Font.register({
  family: "NotoSans",
  fonts: [
    { src: path.join(FONT_DIR, "noto-sans-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "noto-sans-latin-700-normal.woff"), fontWeight: 700 },
  ],
});
// The rupee sign lives in the latin-ext subset, so it gets its own family
Font.register({
  family: "NotoSansExt",
  fonts: [
    { src: path.join(FONT_DIR, "noto-sans-latin-ext-400-normal.woff"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "noto-sans-latin-ext-700-normal.woff"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const SOFT = "#F8FAFC";

const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 8.5,
    color: INK,
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 32,
    lineHeight: 1.35,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  byline: { fontSize: 8, fontWeight: 700, marginTop: 5 },
  tagline: { fontSize: 7.5, color: MUTED, marginTop: 3 },
  title: { fontSize: 20, fontWeight: 700, textAlign: "right", lineHeight: 1.2, marginBottom: 6 },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  metaLabel: { color: MUTED, width: 70, textAlign: "right", marginRight: 8 },
  metaValue: { fontWeight: 700, width: 86, textAlign: "right" },
  rule: { height: 2, marginTop: 12, marginBottom: 12 },
  parties: { flexDirection: "row", gap: 14 },
  party: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4, padding: 9 },
  label: { fontSize: 7, fontWeight: 700, color: MUTED, letterSpacing: 0.8, marginBottom: 4 },
  partyName: { fontSize: 10.5, fontWeight: 700, marginBottom: 2 },
  kv: { flexDirection: "row", marginTop: 1 },
  k: { color: MUTED, width: 44 },
  bold: { fontWeight: 700 },
  supply: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: SOFT,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    marginTop: 10,
  },
  thead: { flexDirection: "row", marginTop: 12, paddingVertical: 6, paddingHorizontal: 6, borderRadius: 3 },
  th: { color: "#FFFFFF", fontSize: 7.5, fontWeight: 700 },
  tr: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  sub: { fontSize: 7.5, color: MUTED },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  below: { flexDirection: "row", marginTop: 12, gap: 14 },
  totalsBox: { width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 4,
  },
  grandText: { color: "#FFFFFF", fontSize: 11, fontWeight: 700 },
  block: { marginBottom: 10 },
  sign: { marginTop: 26, alignItems: "flex-end" },
  signLine: { width: 170, borderTopWidth: 1, borderTopColor: "#94A3B8", marginTop: 38, marginBottom: 3 },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
  },
  watermark: {
    position: "absolute",
    top: 330,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 96,
    fontWeight: 700,
    color: "#F1F5F9",
    transform: "rotate(-28deg)",
  },
});

function Rupee({ value, bold }: { value: number; bold?: boolean }) {
  return (
    <Text>
      <Text style={{ fontFamily: "NotoSansExt", fontWeight: bold ? 700 : 400 }}>₹</Text>
      {formatINR(value)}
    </Text>
  );
}

function InvoiceDocument({ invoice, logo }: { invoice: InvoiceData; logo: Buffer }) {
  const brand = BRAND_CONFIG[invoice.brand];
  const c = invoice.customer;
  const t = invoice.totals;
  const supplyCode = invoice.placeOfSupplyCode || c.stateCode;
  const hasDiscount = invoice.items.some((i) => (i.discountPercent || 0) > 0);
  const bank = invoice.bank || {};
  const hasBank = !!(bank.accountNumber || bank.upiId);
  const watermark = invoice.status === "DRAFT" ? "DRAFT" : invoice.status === "CANCELLED" ? "CANCELLED" : "";
  const logoHeight = 34;
  const logoWidth = Math.min((brand.logoWidth / brand.logoHeight) * logoHeight, 170);

  const col = {
    no: { width: 18 },
    desc: { flex: 1, paddingRight: 6 },
    hsn: { width: 46 },
    qty: { width: 46 },
    rate: { width: 62 },
    disc: { width: 32 },
    taxable: { width: 68 },
    gst: { width: 62 },
    amount: { width: 72 },
  };

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber || "Draft"}`}
      author={SELLER.tradeName}
      subject={`Tax invoice for ${c.name}`}
    >
      <Page size="A4" style={s.page}>
        {watermark ? (
          <Text style={s.watermark} fixed>
            {watermark}
          </Text>
        ) : null}

        <View style={s.header}>
          <View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={{ data: logo, format: "png" }}
              style={{ width: logoWidth, height: (logoWidth * brand.logoHeight) / brand.logoWidth }}
            />
            {brand.byline ? <Text style={[s.byline, { color: brand.accent }]}>{brand.byline}</Text> : null}
            <Text style={s.tagline}>{brand.tagline}</Text>
          </View>
          <View>
            <Text style={[s.title, { color: brand.accent }]}>TAX INVOICE</Text>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice No.</Text>
              <Text style={s.metaValue}>{invoice.invoiceNumber || "DRAFT"}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Invoice Date</Text>
              <Text style={s.metaValue}>{formatInvoiceDate(invoice.invoiceDate)}</Text>
            </View>
            {invoice.dueDate ? (
              <View style={s.metaRow}>
                <Text style={s.metaLabel}>Due Date</Text>
                <Text style={s.metaValue}>{formatInvoiceDate(invoice.dueDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[s.rule, { backgroundColor: brand.accent }]} />

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>SOLD BY</Text>
            <Text style={s.partyName}>{SELLER.tradeName}</Text>
            <Text style={s.sub}>Proprietor: {SELLER.legalName}</Text>
            {SELLER.addressLines.map((line) => (
              <Text key={line}>{line}</Text>
            ))}
            <View style={[s.kv, { marginTop: 4 }]}>
              <Text style={s.k}>GSTIN</Text>
              <Text style={s.bold}>{SELLER.gstin}</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.k}>PAN</Text>
              <Text>{SELLER.pan}</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.k}>State</Text>
              <Text>
                {SELLER.stateName} ({SELLER.stateCode})
              </Text>
            </View>
            {invoice.sellerPhone ? (
              <View style={s.kv}>
                <Text style={s.k}>Phone</Text>
                <Text>{invoice.sellerPhone}</Text>
              </View>
            ) : null}
            {invoice.sellerEmail ? (
              <View style={s.kv}>
                <Text style={s.k}>Email</Text>
                <Text>{invoice.sellerEmail}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.party}>
            <Text style={s.label}>BILL TO</Text>
            <Text style={s.partyName}>{c.name}</Text>
            {c.address ? <Text>{c.address}</Text> : null}
            <Text>
              {[c.city, stateName(c.stateCode)].filter(Boolean).join(", ")}
              {c.pincode ? ` - ${c.pincode}` : ""}
            </Text>
            <View style={[s.kv, { marginTop: 4 }]}>
              <Text style={s.k}>GSTIN</Text>
              <Text style={s.bold}>{c.gstin || "Unregistered"}</Text>
            </View>
            <View style={s.kv}>
              <Text style={s.k}>State</Text>
              <Text>
                {stateName(c.stateCode)} ({c.stateCode})
              </Text>
            </View>
            {c.phone ? (
              <View style={s.kv}>
                <Text style={s.k}>Phone</Text>
                <Text>{c.phone}</Text>
              </View>
            ) : null}
            {c.email ? (
              <View style={s.kv}>
                <Text style={s.k}>Email</Text>
                <Text>{c.email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.supply}>
          <Text>
            <Text style={{ color: MUTED }}>Place of Supply: </Text>
            <Text style={s.bold}>
              {stateName(supplyCode)} ({supplyCode})
            </Text>
          </Text>
          <Text style={{ color: MUTED }}>
            {invoice.isInterState ? "Inter-state supply (IGST)" : "Intra-state supply (CGST + SGST)"}
            {invoice.pricesIncludeTax ? "  |  Rates are inclusive of GST" : ""}
          </Text>
        </View>

        <View style={[s.thead, { backgroundColor: brand.accent }]}>
          <Text style={[s.th, col.no]}>#</Text>
          <Text style={[s.th, col.desc]}>Item & Description</Text>
          <Text style={[s.th, col.hsn]}>HSN/SAC</Text>
          <Text style={[s.th, col.qty, s.right]}>Qty</Text>
          <Text style={[s.th, col.rate, s.right]}>Rate</Text>
          {hasDiscount ? <Text style={[s.th, col.disc, s.right]}>Disc.</Text> : null}
          <Text style={[s.th, col.taxable, s.right]}>Taxable</Text>
          <Text style={[s.th, col.gst, s.right]}>GST</Text>
          <Text style={[s.th, col.amount, s.right]}>Amount</Text>
        </View>

        {invoice.items.map((item, index) => (
          <View key={index} style={s.tr} wrap={false}>
            <Text style={col.no}>{index + 1}</Text>
            <View style={col.desc}>
              <Text style={s.bold}>{item.description}</Text>
              {item.details ? <Text style={s.sub}>{item.details}</Text> : null}
            </View>
            <Text style={col.hsn}>{item.hsnSac || "-"}</Text>
            <Text style={[col.qty, s.right]}>
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </Text>
            <Text style={[col.rate, s.right]}>{formatINR(item.rate)}</Text>
            {hasDiscount ? (
              <Text style={[col.disc, s.right]}>{item.discountPercent ? `${item.discountPercent}%` : "-"}</Text>
            ) : null}
            <Text style={[col.taxable, s.right]}>{formatINR(item.taxableValue)}</Text>
            <View style={col.gst}>
              <Text style={s.right}>{formatINR(item.taxAmount)}</Text>
              <Text style={[s.sub, s.right]}>@ {item.gstRate}%</Text>
            </View>
            <Text style={[col.amount, s.right, s.bold]}>{formatINR(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={s.below} wrap={false}>
          <View style={{ flex: 1 }}>
            <View style={s.block}>
              <Text style={s.label}>AMOUNT IN WORDS</Text>
              <Text style={s.bold}>{invoice.amountInWords}</Text>
            </View>
            {hasBank ? (
              <View style={s.block}>
                <Text style={s.label}>PAYMENT DETAILS</Text>
                {bank.accountName ? (
                  <View style={s.kv}>
                    <Text style={[s.k, { width: 70 }]}>Account Name</Text>
                    <Text>{bank.accountName}</Text>
                  </View>
                ) : null}
                {bank.bankName ? (
                  <View style={s.kv}>
                    <Text style={[s.k, { width: 70 }]}>Bank</Text>
                    <Text>
                      {bank.bankName}
                      {bank.branch ? `, ${bank.branch}` : ""}
                    </Text>
                  </View>
                ) : null}
                {bank.accountNumber ? (
                  <View style={s.kv}>
                    <Text style={[s.k, { width: 70 }]}>Account No.</Text>
                    <Text style={s.bold}>{bank.accountNumber}</Text>
                  </View>
                ) : null}
                {bank.ifsc ? (
                  <View style={s.kv}>
                    <Text style={[s.k, { width: 70 }]}>IFSC</Text>
                    <Text style={s.bold}>{bank.ifsc}</Text>
                  </View>
                ) : null}
                {bank.upiId ? (
                  <View style={s.kv}>
                    <Text style={[s.k, { width: 70 }]}>UPI ID</Text>
                    <Text>{bank.upiId}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            {invoice.notes ? (
              <View style={s.block}>
                <Text style={s.label}>NOTES</Text>
                <Text>{invoice.notes}</Text>
              </View>
            ) : null}
            {invoice.terms ? (
              <View style={s.block}>
                <Text style={s.label}>TERMS & CONDITIONS</Text>
                <Text style={{ color: "#334155" }}>{invoice.terms}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.totalsBox}>
            {t.discount > 0 ? (
              <View style={s.totalRow}>
                <Text style={{ color: MUTED }}>Discount given</Text>
                <Rupee value={t.discount} />
              </View>
            ) : null}
            <View style={s.totalRow}>
              <Text style={{ color: MUTED }}>Taxable Value</Text>
              <Rupee value={t.taxableValue} />
            </View>
            {invoice.isInterState ? (
              <View style={s.totalRow}>
                <Text style={{ color: MUTED }}>IGST</Text>
                <Rupee value={t.igst} />
              </View>
            ) : (
              <>
                <View style={s.totalRow}>
                  <Text style={{ color: MUTED }}>CGST</Text>
                  <Rupee value={t.cgst} />
                </View>
                <View style={s.totalRow}>
                  <Text style={{ color: MUTED }}>SGST</Text>
                  <Rupee value={t.sgst} />
                </View>
              </>
            )}
            {t.roundOff !== 0 ? (
              <View style={s.totalRow}>
                <Text style={{ color: MUTED }}>Round Off</Text>
                <Text>
                  {t.roundOff > 0 ? "+" : "-"}
                  {formatINR(Math.abs(t.roundOff))}
                </Text>
              </View>
            ) : null}
            <View style={[s.grand, { backgroundColor: brand.accent }]}>
              <Text style={s.grandText}>Total</Text>
              <Text style={s.grandText}>
                <Rupee value={t.grandTotal} bold />
              </Text>
            </View>

            <View style={s.sign}>
              <Text style={s.bold}>For {SELLER.tradeName}</Text>
              <View style={s.signLine} />
              <Text>{invoice.signatoryName || SELLER.legalName}</Text>
              <Text style={s.sub}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>This is a computer-generated invoice.  |  {brand.website}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${invoice.invoiceNumber || "Draft"}  |  Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  // Passed as a buffer: a Windows absolute path ("D:\...") would be mistaken for a URL
  const logo = await readFile(path.join(process.cwd(), "public", BRAND_CONFIG[invoice.brand].logoFile));
  return renderToBuffer(<InvoiceDocument invoice={invoice} logo={logo} />);
}
