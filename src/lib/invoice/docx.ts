import path from "path";
import { readFile } from "fs/promises";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { InvoiceData } from "@/models/Invoice";
import { formatINR } from "@/lib/invoice/calc";
import { SELLER, BRAND_CONFIG, stateName, formatInvoiceDate } from "@/lib/invoice/config";

// A4 with 0.6in margins, in twips (1/20 pt)
const MARGIN = 864;
const CONTENT_WIDTH = 11906 - MARGIN * 2;

const INK = "0F172A";
const MUTED = "64748B";
const LINE = "E2E8F0";
const FONT = "Calibri";

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];

interface RunOpts {
  bold?: boolean;
  color?: string;
  size?: number;
}

function run(text: string, opts: RunOpts = {}) {
  return new TextRun({
    text,
    bold: opts.bold,
    color: opts.color || INK,
    size: opts.size || 17,
    font: FONT,
  });
}

function para(children: TextRun[] | string, align?: Align, opts: RunOpts = {}) {
  return new Paragraph({
    alignment: align,
    spacing: { before: 0, after: 20 },
    children: typeof children === "string" ? [run(children, opts)] : children,
  });
}

/** Multi-line text (addresses, terms) as one paragraph per line. */
function lines(text: string, opts: RunOpts = {}) {
  return text.split(/\r?\n/).map((line) => para(line, undefined, opts));
}

function label(text: string) {
  return para(text, undefined, { bold: true, color: MUTED, size: 14 });
}

function kv(key: string, value: string, boldValue = false) {
  return para([run(`${key}: `, { color: MUTED }), run(value, { bold: boldValue })]);
}

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const THIN = { style: BorderStyle.SINGLE, size: 4, color: LINE };

interface CellOpts {
  width: number;
  fill?: string;
  borders?: "none" | "box" | "bottom";
  padding?: number;
}

function cell(children: Paragraph[], opts: CellOpts) {
  const pad = opts.padding ?? 80;
  return new TableCell({
    width: { size: opts.width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    margins: { top: pad, bottom: pad, left: pad, right: pad },
    shading: opts.fill ? { type: ShadingType.CLEAR, fill: opts.fill, color: "auto" } : undefined,
    borders:
      opts.borders === "box"
        ? { top: THIN, bottom: THIN, left: THIN, right: THIN }
        : opts.borders === "bottom"
          ? { ...NO_BORDERS, bottom: THIN }
          : NO_BORDERS,
    children,
  });
}

function table(columnWidths: number[], rows: TableRow[]) {
  return new Table({
    width: { size: columnWidths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths,
    layout: TableLayoutType.FIXED,
    borders: { ...NO_BORDERS, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER },
    rows,
  });
}

function spacer(after = 160) {
  return new Paragraph({ spacing: { before: 0, after }, children: [] });
}

export async function renderInvoiceDocx(invoice: InvoiceData): Promise<Buffer> {
  const brand = BRAND_CONFIG[invoice.brand];
  const accent = brand.accent.replace("#", "");
  const c = invoice.customer;
  const t = invoice.totals;
  const supplyCode = invoice.placeOfSupplyCode || c.stateCode;
  const bank = invoice.bank || {};
  const hasBank = !!(bank.accountNumber || bank.upiId);
  const hasDiscount = invoice.items.some((i) => (i.discountPercent || 0) > 0);
  const numberText =
    invoice.status === "CANCELLED"
      ? `${invoice.invoiceNumber} (CANCELLED)`
      : invoice.invoiceNumber || "DRAFT";

  const logo = await readFile(path.join(process.cwd(), "public", brand.logoFile));
  const logoHeight = 44;
  const logoWidth = Math.min(Math.round((brand.logoWidth / brand.logoHeight) * logoHeight), 220);

  // ── Header: logo + title/meta ──────────────────────────────────────────
  const half = Math.floor(CONTENT_WIDTH / 2);
  const header = table(
    [half, CONTENT_WIDTH - half],
    [
      new TableRow({
        children: [
          cell(
            [
              new Paragraph({
                children: [
                  new ImageRun({
                    type: "png",
                    data: logo,
                    transformation: {
                      width: logoWidth,
                      height: Math.round((logoWidth * brand.logoHeight) / brand.logoWidth),
                    },
                  }),
                ],
              }),
              ...(brand.byline ? [para(brand.byline, undefined, { bold: true, color: accent, size: 16 })] : []),
              para(brand.tagline, undefined, { color: MUTED, size: 15 }),
            ],
            { width: half, padding: 0 }
          ),
          cell(
            [
              para("TAX INVOICE", AlignmentType.RIGHT, { bold: true, color: accent, size: 40 }),
              para([run("Invoice No.  ", { color: MUTED }), run(numberText, { bold: true })], AlignmentType.RIGHT),
              para(
                [run("Invoice Date  ", { color: MUTED }), run(formatInvoiceDate(invoice.invoiceDate), { bold: true })],
                AlignmentType.RIGHT
              ),
              ...(invoice.dueDate
                ? [
                    para(
                      [run("Due Date  ", { color: MUTED }), run(formatInvoiceDate(invoice.dueDate), { bold: true })],
                      AlignmentType.RIGHT
                    ),
                  ]
                : []),
            ],
            { width: CONTENT_WIDTH - half, padding: 0 }
          ),
        ],
      }),
    ]
  );

  const rule = new Paragraph({
    spacing: { before: 120, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 16, color: accent, space: 1 } },
    children: [],
  });

  // ── Parties ────────────────────────────────────────────────────────────
  const gap = 240;
  const partyWidth = Math.floor((CONTENT_WIDTH - gap) / 2);
  const parties = table(
    [partyWidth, gap, CONTENT_WIDTH - partyWidth - gap],
    [
      new TableRow({
        children: [
          cell(
            [
              label("SOLD BY"),
              para(SELLER.tradeName, undefined, { bold: true, size: 21 }),
              para(`Proprietor: ${SELLER.legalName}`, undefined, { color: MUTED, size: 15 }),
              ...SELLER.addressLines.map((line) => para(line)),
              kv("GSTIN", SELLER.gstin, true),
              kv("PAN", SELLER.pan),
              kv("State", `${SELLER.stateName} (${SELLER.stateCode})`),
              ...(invoice.sellerPhone ? [kv("Phone", invoice.sellerPhone)] : []),
              ...(invoice.sellerEmail ? [kv("Email", invoice.sellerEmail)] : []),
            ],
            { width: partyWidth, borders: "box", padding: 140 }
          ),
          cell([para("")], { width: gap, padding: 0 }),
          cell(
            [
              label("BILL TO"),
              para(c.name, undefined, { bold: true, size: 21 }),
              ...(c.address ? lines(c.address) : []),
              para(
                `${[c.city, stateName(c.stateCode)].filter(Boolean).join(", ")}${c.pincode ? ` - ${c.pincode}` : ""}`
              ),
              kv("GSTIN", c.gstin || "Unregistered", true),
              kv("State", `${stateName(c.stateCode)} (${c.stateCode})`),
              ...(c.phone ? [kv("Phone", c.phone)] : []),
              ...(c.email ? [kv("Email", c.email)] : []),
            ],
            { width: CONTENT_WIDTH - partyWidth - gap, borders: "box", padding: 140 }
          ),
        ],
      }),
    ]
  );

  const supply = para([
    run("Place of Supply: ", { color: MUTED }),
    run(`${stateName(supplyCode)} (${supplyCode})`, { bold: true }),
    run(
      `     ${invoice.isInterState ? "Inter-state supply (IGST)" : "Intra-state supply (CGST + SGST)"}${
        invoice.pricesIncludeTax ? "  |  Rates are inclusive of GST" : ""
      }`,
      { color: MUTED }
    ),
  ]);

  // ── Line items ─────────────────────────────────────────────────────────
  const fixed = {
    no: 420,
    hsn: 950,
    qty: 950,
    rate: 1200,
    disc: hasDiscount ? 700 : 0,
    taxable: 1350,
    gst: 1250,
    amount: 1400,
  };
  const descWidth =
    CONTENT_WIDTH - Object.values(fixed).reduce((a, b) => a + b, 0);
  const R = AlignmentType.RIGHT;

  const columns: { head: string; width: number; align?: Align }[] = [
    { head: "#", width: fixed.no },
    { head: "Item & Description", width: descWidth },
    { head: "HSN/SAC", width: fixed.hsn },
    { head: "Qty", width: fixed.qty, align: R },
    { head: "Rate", width: fixed.rate, align: R },
    ...(hasDiscount ? [{ head: "Disc.", width: fixed.disc, align: R }] : []),
    { head: "Taxable", width: fixed.taxable, align: R },
    { head: "GST", width: fixed.gst, align: R },
    { head: "Amount", width: fixed.amount, align: R },
  ];

  const itemRows = invoice.items.map((item, index) => {
    const cells: Paragraph[][] = [
      [para(String(index + 1))],
      [
        para(item.description, undefined, { bold: true }),
        ...(item.details ? lines(item.details, { color: MUTED, size: 15 }) : []),
      ],
      [para(item.hsnSac || "-")],
      [para(`${item.quantity}${item.unit ? ` ${item.unit}` : ""}`, R)],
      [para(formatINR(item.rate), R)],
      ...(hasDiscount ? [[para(item.discountPercent ? `${item.discountPercent}%` : "-", R)]] : []),
      [para(formatINR(item.taxableValue), R)],
      [para(formatINR(item.taxAmount), R), para(`@ ${item.gstRate}%`, R, { color: MUTED, size: 15 })],
      [para(formatINR(item.lineTotal), R, { bold: true })],
    ];
    return new TableRow({
      cantSplit: true,
      children: cells.map((children, i) => cell(children, { width: columns[i].width, borders: "bottom" })),
    });
  });

  const items = table(
    columns.map((col) => col.width),
    [
      new TableRow({
        tableHeader: true,
        children: columns.map((col) =>
          cell([para(col.head, col.align, { bold: true, color: "FFFFFF", size: 16 })], {
            width: col.width,
            fill: accent,
          })
        ),
      }),
      ...itemRows,
    ]
  );

  // ── Left: words, bank, notes, terms. Right: totals + signature ─────────
  const left: Paragraph[] = [label("AMOUNT IN WORDS"), para(invoice.amountInWords, undefined, { bold: true }), spacer(100)];
  if (hasBank) {
    left.push(label("PAYMENT DETAILS"));
    if (bank.accountName) left.push(kv("Account Name", bank.accountName));
    if (bank.bankName) left.push(kv("Bank", `${bank.bankName}${bank.branch ? `, ${bank.branch}` : ""}`));
    if (bank.accountNumber) left.push(kv("Account No.", bank.accountNumber, true));
    if (bank.ifsc) left.push(kv("IFSC", bank.ifsc, true));
    if (bank.upiId) left.push(kv("UPI ID", bank.upiId));
    left.push(spacer(100));
  }
  if (invoice.notes) left.push(label("NOTES"), ...lines(invoice.notes), spacer(100));
  if (invoice.terms) left.push(label("TERMS & CONDITIONS"), ...lines(invoice.terms, { color: "334155" }));

  const totalsWidth = 4000;
  const totalLabelWidth = 2000;
  const totalRow = (name: string, value: string) =>
    new TableRow({
      children: [
        cell([para(name, undefined, { color: MUTED })], { width: totalLabelWidth, padding: 50 }),
        cell([para(value, R)], { width: totalsWidth - totalLabelWidth, padding: 50 }),
      ],
    });

  const totalRows: TableRow[] = [];
  if (t.discount > 0) totalRows.push(totalRow("Discount given", `₹${formatINR(t.discount)}`));
  totalRows.push(totalRow("Taxable Value", `₹${formatINR(t.taxableValue)}`));
  if (invoice.isInterState) {
    totalRows.push(totalRow("IGST", `₹${formatINR(t.igst)}`));
  } else {
    totalRows.push(totalRow("CGST", `₹${formatINR(t.cgst)}`), totalRow("SGST", `₹${formatINR(t.sgst)}`));
  }
  if (t.roundOff !== 0) {
    totalRows.push(totalRow("Round Off", `${t.roundOff > 0 ? "+" : "-"}${formatINR(Math.abs(t.roundOff))}`));
  }
  totalRows.push(
    new TableRow({
      children: [
        cell([para("Total", undefined, { bold: true, color: "FFFFFF", size: 22 })], {
          width: totalLabelWidth,
          fill: accent,
          padding: 110,
        }),
        cell([para(`₹${formatINR(t.grandTotal)}`, R, { bold: true, color: "FFFFFF", size: 22 })], {
          width: totalsWidth - totalLabelWidth,
          fill: accent,
          padding: 110,
        }),
      ],
    })
  );

  const below = table(
    [CONTENT_WIDTH - totalsWidth - gap, gap, totalsWidth],
    [
      new TableRow({
        children: [
          cell(left, { width: CONTENT_WIDTH - totalsWidth - gap, padding: 0 }),
          cell([para("")], { width: gap, padding: 0 }),
          new TableCell({
            width: { size: totalsWidth, type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            children: [
              table([totalLabelWidth, totalsWidth - totalLabelWidth], totalRows),
              spacer(360),
              para(`For ${SELLER.tradeName}`, R, { bold: true }),
              spacer(700),
              para(invoice.signatoryName || SELLER.legalName, R),
              para("Authorised Signatory", R, { color: MUTED, size: 15 }),
            ],
          }),
        ],
      }),
    ]
  );

  const doc = new Document({
    creator: SELLER.tradeName,
    title: `Invoice ${invoice.invoiceNumber || "Draft"}`,
    styles: { default: { document: { run: { font: FONT, size: 17, color: INK } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children: [
          header,
          rule,
          parties,
          spacer(160),
          supply,
          spacer(120),
          items,
          spacer(220),
          below,
          spacer(300),
          para(`This is a computer-generated invoice.  |  ${brand.website}`, AlignmentType.CENTER, { color: MUTED, size: 14 }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
