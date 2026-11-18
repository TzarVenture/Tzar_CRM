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
import { formatINR, summarizeByHsn, amountInWords } from "@/lib/invoice/calc";
import {
  SELLER,
  BRAND_CONFIG,
  DOCUMENT_TYPE_LABELS,
  stateName,
  formatInvoiceDate,
} from "@/lib/invoice/config";

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

const INK = "#000000";
const B = 0.75; // rule thickness of the ledger-style grid

/**
 * Classic accounting-software layout: one outer box, ruled cells, seller /
 * consignee / buyer stacked on the left and the reference grid on the right.
 */
const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 8,
    color: INK,
    paddingTop: 26,
    paddingBottom: 30,
    paddingHorizontal: 30,
    lineHeight: 1.25,
  },
  title: { fontSize: 11, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  box: { borderWidth: B, borderColor: INK },
  row: { flexDirection: "row" },
  bold: { fontWeight: 700 },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  small: { fontSize: 7 },
  cell: { padding: 4 },
  partyName: { fontSize: 9.5, fontWeight: 700, lineHeight: 1.35, marginBottom: 1 },
  kv: { flexDirection: "row" },
  k: { width: 62 },
  refCell: { flex: 1, padding: 4, minHeight: 27, borderBottomWidth: B, borderColor: INK },
  refValue: { fontWeight: 700, fontSize: 8.5, marginTop: 1 },
  th: { paddingVertical: 4, paddingHorizontal: 3, fontSize: 7.5, textAlign: "center" },
  td: { paddingVertical: 3, paddingHorizontal: 3 },
  colLine: { borderRightWidth: B, borderColor: INK },
  watermark: {
    position: "absolute",
    top: 330,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 96,
    fontWeight: 700,
    color: "#EEF1F5",
    transform: "rotate(-28deg)",
  },
  footNote: { textAlign: "center", fontSize: 7.5, marginTop: 5 },
});

function Rupee({ value }: { value: number }) {
  return (
    <Text>
      <Text style={{ fontFamily: "NotoSansExt", fontWeight: 700 }}>₹ </Text>
      {formatINR(value)}
    </Text>
  );
}

function PartyBlock({
  heading,
  name,
  lines,
  gstin,
  stateCode,
  extra,
}: {
  heading: string;
  name: string;
  lines: string[];
  gstin?: string;
  stateCode?: string;
  extra?: React.ReactNode;
}) {
  return (
    <View style={s.cell}>
      <Text style={s.small}>{heading}</Text>
      <Text style={s.partyName}>{name}</Text>
      {lines.filter(Boolean).map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      <View style={s.kv}>
        <Text style={s.k}>GSTIN/UIN</Text>
        <Text>: {gstin || "Unregistered"}</Text>
      </View>
      {stateCode ? (
        <View style={s.kv}>
          <Text style={s.k}>State Name</Text>
          <Text>
            : {stateName(stateCode)}, Code : {stateCode}
          </Text>
        </View>
      ) : null}
      {extra}
    </View>
  );
}

function RefCell({ label, value, last }: { label: string; value?: string; last?: boolean }) {
  return (
    <View style={[s.refCell, last ? {} : s.colLine]}>
      <Text>{label}</Text>
      <Text style={s.refValue}>{value || " "}</Text>
    </View>
  );
}

function InvoiceDocument({ invoice, logo }: { invoice: InvoiceData; logo: Buffer }) {
  const brand = BRAND_CONFIG[invoice.brand];
  const docTitle = DOCUMENT_TYPE_LABELS[invoice.documentType || "TAX_INVOICE"];
  const c = invoice.customer;
  const ship = invoice.shipTo?.name ? invoice.shipTo : null;
  const refs = invoice.references || {};
  const t = invoice.totals;
  const bank = invoice.bank || {};
  const supplyCode = invoice.placeOfSupplyCode || c.stateCode;
  const hasDiscount = invoice.items.some((i) => (i.discountPercent || 0) > 0);
  const hsnRows = summarizeByHsn(invoice.items);
  const totalQty = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
  const units = new Set(invoice.items.map((i) => i.unit || ""));
  const qtyUnit = units.size === 1 ? [...units][0] : "";
  const watermark = invoice.status === "DRAFT" ? "DRAFT" : invoice.status === "CANCELLED" ? "CANCELLED" : "";

  const logoHeight = 26;
  const logoWidth = Math.min((brand.logoWidth / brand.logoHeight) * logoHeight, 150);

  const cityLine = (city?: string, stateCode?: string, pincode?: string) =>
    `${[city, stateCode ? stateName(stateCode) : ""].filter(Boolean).join(", ")}${pincode ? ` - ${pincode}` : ""}${
      city || stateCode ? ", India" : ""
    }`;

  // Item table column widths; the description column takes the rest
  const w = { sl: 20, hsn: 52, qty: 62, rate: 56, per: 28, disc: 34, amount: 78 };

  // Tax and round-off lines sit inside the item table, right-aligned under the items
  const chargeLines: { label: string; amount: string }[] = [];
  if (invoice.isInterState) {
    chargeLines.push({ label: "IGST", amount: formatINR(t.igst) });
  } else {
    chargeLines.push({ label: "CGST", amount: formatINR(t.cgst) });
    chargeLines.push({ label: "SGST", amount: formatINR(t.sgst) });
  }
  if (t.roundOff !== 0) {
    chargeLines.push({
      label: "Round Off",
      amount: `${t.roundOff < 0 ? "(-)" : ""}${formatINR(Math.abs(t.roundOff))}`,
    });
  }

  const itemCells = (
    cells: { sl?: React.ReactNode; desc?: React.ReactNode; hsn?: string; qty?: React.ReactNode; rate?: string; per?: string; disc?: string; amount?: React.ReactNode },
    key: string | number,
    extraStyle: Record<string, string | number> = {}
  ) => (
    <View key={key} style={[s.row, extraStyle]} wrap={false}>
      <View style={[s.td, s.colLine, { width: w.sl }]}>{cells.sl}</View>
      <View style={[s.td, s.colLine, { flex: 1 }]}>{cells.desc}</View>
      <View style={[s.td, s.colLine, { width: w.hsn }]}>
        <Text>{cells.hsn || ""}</Text>
      </View>
      <View style={[s.td, s.colLine, { width: w.qty }]}>{cells.qty}</View>
      <View style={[s.td, s.colLine, { width: w.rate }]}>
        <Text style={s.right}>{cells.rate || ""}</Text>
      </View>
      <View style={[s.td, s.colLine, { width: w.per }]}>
        <Text>{cells.per || ""}</Text>
      </View>
      {hasDiscount ? (
        <View style={[s.td, s.colLine, { width: w.disc }]}>
          <Text style={s.right}>{cells.disc || ""}</Text>
        </View>
      ) : null}
      <View style={[s.td, { width: w.amount }]}>{cells.amount}</View>
    </View>
  );

  return (
    <Document
      title={`${docTitle} ${invoice.invoiceNumber || "Draft"}`}
      author={SELLER.tradeName}
      subject={`${docTitle} for ${c.name}`}
    >
      <Page size="A4" style={s.page}>
        {watermark ? (
          <Text style={s.watermark} fixed>
            {watermark}
          </Text>
        ) : null}

        <Text style={s.title}>{docTitle}</Text>

        <View style={s.box}>
          {/* ── Parties (left) + reference grid (right) ── */}
          <View style={[s.row, { borderBottomWidth: B, borderColor: INK }]}>
            <View style={[s.colLine, { width: "50%" }]}>
              <View style={[s.cell, { borderBottomWidth: B, borderColor: INK }]}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image
                  src={{ data: logo, format: "png" }}
                  style={{ width: logoWidth, height: (logoWidth * brand.logoHeight) / brand.logoWidth }}
                />
                {brand.byline ? <Text style={[s.small, s.bold, { marginTop: 2 }]}>{brand.byline}</Text> : null}
                <Text style={[s.partyName, { marginTop: 4 }]}>{SELLER.tradeName}</Text>
                {SELLER.addressLines.map((line) => (
                  <Text key={line}>{line}</Text>
                ))}
                <Text>GSTIN/UIN: {SELLER.gstin}</Text>
                <Text>
                  State Name : {SELLER.stateName}, Code : {SELLER.stateCode}
                </Text>
                {invoice.sellerPhone ? <Text>Contact : {invoice.sellerPhone}</Text> : null}
                {invoice.sellerEmail ? <Text>E-Mail : {invoice.sellerEmail}</Text> : null}
              </View>

              <View style={{ borderBottomWidth: B, borderColor: INK }}>
                <PartyBlock
                  heading="Consignee (Ship to)"
                  name={ship?.name || c.name}
                  lines={
                    ship
                      ? [ship.address || "", cityLine(ship.city, ship.stateCode, ship.pincode)]
                      : [c.address || "", cityLine(c.city, c.stateCode, c.pincode)]
                  }
                  gstin={ship ? ship.gstin : c.gstin}
                  stateCode={ship ? ship.stateCode : c.stateCode}
                />
              </View>

              <PartyBlock
                heading="Buyer (Bill to)"
                name={c.name}
                lines={[c.address || "", cityLine(c.city, c.stateCode, c.pincode)]}
                gstin={c.gstin}
                stateCode={c.stateCode}
                extra={
                  <>
                    {c.phone ? (
                      <View style={s.kv}>
                        <Text style={s.k}>Contact</Text>
                        <Text>: {c.phone}</Text>
                      </View>
                    ) : null}
                    <View style={s.kv}>
                      <Text style={s.k}>Place of Supply</Text>
                      <Text>: {stateName(supplyCode)}</Text>
                    </View>
                  </>
                }
              />
            </View>

            <View style={{ width: "50%" }}>
              <View style={s.row}>
                <RefCell label="Invoice No." value={invoice.invoiceNumber || "DRAFT"} />
                <RefCell label="Dated" value={formatInvoiceDate(invoice.invoiceDate)} last />
              </View>
              <View style={s.row}>
                <RefCell label="Delivery Note" value={refs.deliveryNote} />
                <RefCell
                  label="Mode/Terms of Payment"
                  value={refs.paymentTerms || (invoice.dueDate ? `Due ${formatInvoiceDate(invoice.dueDate)}` : "")}
                  last
                />
              </View>
              <View style={s.row}>
                <RefCell label="Reference No. & Date." value={refs.referenceNo} />
                <RefCell label="Other References" value={refs.otherReferences} last />
              </View>
              <View style={s.row}>
                <RefCell label="Buyer's Order No." value={refs.buyerOrderNo} />
                <RefCell label="Dated" value={refs.buyerOrderDate} last />
              </View>
              <View style={s.row}>
                <RefCell label="Dispatch Doc No." value={refs.dispatchDocNo} />
                <RefCell label="Delivery Note Date" value={refs.deliveryNoteDate} last />
              </View>
              <View style={s.row}>
                <RefCell label="Dispatched through" value={refs.dispatchedThrough} />
                <RefCell label="Destination" value={refs.destination} last />
              </View>
              <View style={s.cell}>
                <Text>Terms of Delivery</Text>
                <Text style={s.refValue}>{refs.termsOfDelivery || " "}</Text>
              </View>
            </View>
          </View>

          {/* ── Items ── */}
          <View style={[s.row, { borderBottomWidth: B, borderColor: INK }]}>
            <Text style={[s.th, s.colLine, { width: w.sl }]}>Sl No.</Text>
            <Text style={[s.th, s.colLine, { flex: 1 }]}>Description of Goods / Services</Text>
            <Text style={[s.th, s.colLine, { width: w.hsn }]}>HSN/SAC</Text>
            <Text style={[s.th, s.colLine, { width: w.qty }]}>Quantity</Text>
            <Text style={[s.th, s.colLine, { width: w.rate }]}>Rate</Text>
            <Text style={[s.th, s.colLine, { width: w.per }]}>per</Text>
            {hasDiscount ? <Text style={[s.th, s.colLine, { width: w.disc }]}>Disc. %</Text> : null}
            <Text style={[s.th, { width: w.amount }]}>Amount</Text>
          </View>

          {invoice.items.map((item, index) =>
            itemCells(
              {
                sl: <Text>{index + 1}</Text>,
                desc: (
                  <>
                    <Text style={[s.bold, { fontSize: 8.5 }]}>{item.description}</Text>
                    {item.details ? <Text style={s.small}>{item.details}</Text> : null}
                  </>
                ),
                hsn: item.hsnSac,
                qty: (
                  <Text style={[s.right, s.bold]}>
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </Text>
                ),
                rate: formatINR(item.rate),
                per: item.unit,
                disc: item.discountPercent ? `${item.discountPercent} %` : "",
                amount: (
                  <Text style={[s.right, s.bold]}>
                    {formatINR(item.taxableValue)}
                  </Text>
                ),
              },
              index
            )
          )}

          {/* Blank band so short invoices keep the tall ruled-table look */}
          {itemCells({}, "gap", { minHeight: 14 })}

          {chargeLines.map((line) =>
            itemCells(
              {
                desc: <Text style={[s.right, s.bold]}>{line.label}</Text>,
                amount: <Text style={[s.right, s.bold]}>{line.amount}</Text>,
              },
              line.label
            )
          )}

          {itemCells({}, "tail", { minHeight: invoice.items.length > 6 ? 10 : 48 })}

          {itemCells(
            {
              desc: <Text style={s.right}>Total</Text>,
              qty: (
                <Text style={[s.right, s.bold]}>
                  {totalQty}
                  {qtyUnit ? ` ${qtyUnit}` : ""}
                </Text>
              ),
              amount: (
                <Text style={[s.right, s.bold, { fontSize: 9.5 }]}>
                  <Rupee value={t.grandTotal} />
                </Text>
              ),
            },
            "total",
            { borderTopWidth: B, borderBottomWidth: B, borderColor: INK }
          )}

          {/* ── Amount in words ── */}
          <View style={[s.cell, { borderBottomWidth: B, borderColor: INK }]} wrap={false}>
            <View style={[s.row, { justifyContent: "space-between" }]}>
              <Text>Amount Chargeable (in words)</Text>
              <Text>E. & O.E</Text>
            </View>
            <Text style={[s.bold, { fontSize: 9 }]}>Indian {invoice.amountInWords}</Text>
            {invoice.pricesIncludeTax ? <Text style={s.small}>Rates shown are inclusive of GST.</Text> : null}
          </View>

          {/* ── HSN/SAC-wise tax summary ── */}
          <View wrap={false}>
            <View style={[s.row, { borderBottomWidth: B, borderColor: INK }]}>
              <Text style={[s.th, s.colLine, { flex: 1 }]}>HSN/SAC</Text>
              <Text style={[s.th, s.colLine, { width: 74 }]}>Taxable Value</Text>
              {invoice.isInterState ? (
                <>
                  <Text style={[s.th, s.colLine, { width: 50 }]}>IGST Rate</Text>
                  <Text style={[s.th, s.colLine, { width: 80 }]}>IGST Amount</Text>
                </>
              ) : (
                <>
                  <Text style={[s.th, s.colLine, { width: 40 }]}>CGST Rate</Text>
                  <Text style={[s.th, s.colLine, { width: 62 }]}>CGST Amount</Text>
                  <Text style={[s.th, s.colLine, { width: 40 }]}>SGST Rate</Text>
                  <Text style={[s.th, s.colLine, { width: 62 }]}>SGST Amount</Text>
                </>
              )}
              <Text style={[s.th, { width: 78 }]}>Total Tax Amount</Text>
            </View>
            {hsnRows.map((row) => (
              <View key={`${row.hsnSac}|${row.gstRate}`} style={s.row}>
                <Text style={[s.td, s.colLine, { flex: 1 }]}>{row.hsnSac || "-"}</Text>
                <Text style={[s.td, s.colLine, s.right, { width: 74 }]}>{formatINR(row.taxableValue)}</Text>
                {invoice.isInterState ? (
                  <>
                    <Text style={[s.td, s.colLine, s.right, { width: 50 }]}>{row.gstRate}%</Text>
                    <Text style={[s.td, s.colLine, s.right, { width: 80 }]}>{formatINR(row.igst)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[s.td, s.colLine, s.right, { width: 40 }]}>{row.gstRate / 2}%</Text>
                    <Text style={[s.td, s.colLine, s.right, { width: 62 }]}>{formatINR(row.cgst)}</Text>
                    <Text style={[s.td, s.colLine, s.right, { width: 40 }]}>{row.gstRate / 2}%</Text>
                    <Text style={[s.td, s.colLine, s.right, { width: 62 }]}>{formatINR(row.sgst)}</Text>
                  </>
                )}
                <Text style={[s.td, s.right, { width: 78 }]}>{formatINR(row.taxAmount)}</Text>
              </View>
            ))}
            <View style={[s.row, { borderTopWidth: B, borderBottomWidth: B, borderColor: INK }]}>
              <Text style={[s.td, s.colLine, s.right, s.bold, { flex: 1 }]}>Total</Text>
              <Text style={[s.td, s.colLine, s.right, s.bold, { width: 74 }]}>{formatINR(t.taxableValue)}</Text>
              {invoice.isInterState ? (
                <>
                  <Text style={[s.td, s.colLine, { width: 50 }]}> </Text>
                  <Text style={[s.td, s.colLine, s.right, s.bold, { width: 80 }]}>{formatINR(t.igst)}</Text>
                </>
              ) : (
                <>
                  <Text style={[s.td, s.colLine, { width: 40 }]}> </Text>
                  <Text style={[s.td, s.colLine, s.right, s.bold, { width: 62 }]}>{formatINR(t.cgst)}</Text>
                  <Text style={[s.td, s.colLine, { width: 40 }]}> </Text>
                  <Text style={[s.td, s.colLine, s.right, s.bold, { width: 62 }]}>{formatINR(t.sgst)}</Text>
                </>
              )}
              <Text style={[s.td, s.right, s.bold, { width: 78 }]}>{formatINR(t.totalTax)}</Text>
            </View>
          </View>

          <View style={s.cell} wrap={false}>
            <Text>
              Tax Amount (in words) : <Text style={s.bold}>Indian {amountInWords(t.totalTax)}</Text>
            </Text>
          </View>

          {/* ── Declaration (left) + bank details and signature (right) ── */}
          <View style={s.row}>
            <View style={[s.cell, { width: "50%", justifyContent: "flex-end" }]}>
              {invoice.notes ? (
                <View style={{ marginBottom: 5 }}>
                  <Text style={s.bold}>Remarks</Text>
                  <Text>{invoice.notes}</Text>
                </View>
              ) : null}
              {invoice.terms ? (
                <View style={{ marginBottom: 5 }}>
                  <Text style={s.bold}>Terms & Conditions</Text>
                  <Text>{invoice.terms}</Text>
                </View>
              ) : null}
              <Text style={{ textDecoration: "underline" }}>Declaration</Text>
              <Text>
                We declare that this invoice shows the actual price of the goods or services described and
                that all particulars are true and correct.
              </Text>
            </View>
            <View style={{ width: "50%" }}>
              {bank.accountNumber || bank.upiId ? (
                <View style={s.cell}>
                  <Text>Company&apos;s Bank Details</Text>
                  {bank.accountName ? (
                    <View style={s.kv}>
                      <Text style={{ width: 92 }}>A/c Holder&apos;s Name</Text>
                      <Text style={s.bold}>: {bank.accountName}</Text>
                    </View>
                  ) : null}
                  {bank.bankName ? (
                    <View style={s.kv}>
                      <Text style={{ width: 92 }}>Bank Name</Text>
                      <Text style={s.bold}>: {bank.bankName}</Text>
                    </View>
                  ) : null}
                  {bank.accountNumber ? (
                    <View style={s.kv}>
                      <Text style={{ width: 92 }}>A/c No.</Text>
                      <Text style={s.bold}>: {bank.accountNumber}</Text>
                    </View>
                  ) : null}
                  {bank.ifsc ? (
                    <View style={s.kv}>
                      <Text style={{ width: 92 }}>Branch & IFS Code</Text>
                      <Text style={s.bold}>
                        : {[bank.branch, bank.ifsc].filter(Boolean).join(" & ")}
                      </Text>
                    </View>
                  ) : null}
                  {bank.upiId ? (
                    <View style={s.kv}>
                      <Text style={{ width: 92 }}>UPI ID</Text>
                      <Text style={s.bold}>: {bank.upiId}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <View
                style={[
                  s.cell,
                  { borderTopWidth: B, borderLeftWidth: B, borderColor: INK, minHeight: 58, justifyContent: "space-between" },
                ]}
              >
                <Text style={[s.right, s.bold]}>for {SELLER.tradeName}</Text>
                <Text style={s.right}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={s.footNote}>SUBJECT TO MUMBAI JURISDICTION</Text>
        <Text style={[s.footNote, { marginTop: 2 }]}>This is a Computer Generated Invoice</Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  // Passed as a buffer: a Windows absolute path ("D:\...") would be mistaken for a URL
  const logo = await readFile(path.join(process.cwd(), "public", BRAND_CONFIG[invoice.brand].logoFile));
  return renderToBuffer(<InvoiceDocument invoice={invoice} logo={logo} />);
}
