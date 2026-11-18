import { round2 } from "@/lib/invoice/calc";
import { AccExpense, AccInvoice, AccPayment, isSale } from "./types";

/**
 * Tally Prime / ERP 9 import file. Contains ledger masters (so the import does not
 * fail on missing ledgers) followed by Sales, Receipt and Payment/Journal vouchers.
 * Import with: Gateway of Tally > Import > Data.
 */

const BRAND_NAMES: Record<string, string> = {
  tzar: "Tzar Digital Agency",
  adshalaa: "Adshalaa Edutech",
  crownleaf: "Crownleaf Luxury Gifting",
  titepo: "Titepo",
  general: "General",
};

export function xmlEscape(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function tallyDate(d: Date): string {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

const amt = (n: number) => round2(n).toFixed(2);

interface Entry {
  ledger: string;
  /** true = debit (Tally stores debits as negative amounts) */
  debit: boolean;
  amount: number;
}

function entriesXml(entries: Entry[]): string {
  return entries
    .filter((e) => round2(e.amount) !== 0)
    .map(
      (e) =>
        `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${xmlEscape(e.ledger)}</LEDGERNAME>` +
        `<ISDEEMEDPOSITIVE>${e.debit ? "Yes" : "No"}</ISDEEMEDPOSITIVE>` +
        `<AMOUNT>${e.debit ? "-" : ""}${amt(e.amount)}</AMOUNT></ALLLEDGERENTRIES.LIST>`
    )
    .join("");
}

function voucherXml(o: {
  type: "Sales" | "Receipt" | "Payment" | "Journal";
  date: Date;
  number: string;
  party: string;
  narration: string;
  entries: Entry[];
}): string {
  return (
    `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${o.type}" ACTION="Create" OBJVIEW="Accounting Voucher View">` +
    `<DATE>${tallyDate(o.date)}</DATE><VOUCHERTYPENAME>${o.type}</VOUCHERTYPENAME>` +
    `<VOUCHERNUMBER>${xmlEscape(o.number)}</VOUCHERNUMBER>` +
    `<PARTYLEDGERNAME>${xmlEscape(o.party)}</PARTYLEDGERNAME>` +
    `<NARRATION>${xmlEscape(o.narration)}</NARRATION>` +
    entriesXml(o.entries) +
    `</VOUCHER></TALLYMESSAGE>`
  );
}

function ledgerMaster(name: string, parent: string): string {
  return (
    `<TALLYMESSAGE xmlns:UDF="TallyUDF"><LEDGER NAME="${xmlEscape(name)}" ACTION="Create">` +
    `<NAME>${xmlEscape(name)}</NAME><PARENT>${xmlEscape(parent)}</PARENT></LEDGER></TALLYMESSAGE>`
  );
}

const cashOrBank = (mode: string) => (mode === "Cash" ? "Cash" : "Bank Account");

export interface TallyExportInput {
  invoices: AccInvoice[];
  payments: AccPayment[];
  expenses: (AccExpense & { paymentMode?: string; paymentStatus?: "PAID" | "UNPAID" })[];
}

export function buildTallyXml({ invoices, payments, expenses }: TallyExportInput): string {
  const sales = invoices.filter(isSale);
  const salesById = new Map(sales.map((i) => [i.id, i]));
  const masters = new Map<string, string>(); // ledger name -> parent group
  const addMaster = (name: string, parent: string) => {
    if (!masters.has(name)) masters.set(name, parent);
  };
  const vouchers: string[] = [];

  for (const inv of sales) {
    const party = inv.customerName;
    const salesLedger = `Sales - ${BRAND_NAMES[inv.brand] || inv.brand}`;
    addMaster(party, "Sundry Debtors");
    addMaster(salesLedger, "Sales Accounts");
    const entries: Entry[] = [
      { ledger: party, debit: true, amount: inv.totals.grandTotal },
      { ledger: salesLedger, debit: false, amount: inv.totals.taxableValue },
    ];
    for (const [name, value] of [
      ["Output CGST", inv.totals.cgst],
      ["Output SGST", inv.totals.sgst],
      ["Output IGST", inv.totals.igst],
    ] as const) {
      if (value) {
        addMaster(name, "Duties & Taxes");
        entries.push({ ledger: name, debit: false, amount: value });
      }
    }
    if (inv.totals.roundOff) {
      addMaster("Round Off", "Indirect Expenses");
      entries.push({ ledger: "Round Off", debit: inv.totals.roundOff < 0, amount: Math.abs(inv.totals.roundOff) });
    }
    vouchers.push(
      voucherXml({ type: "Sales", date: inv.invoiceDate, number: inv.invoiceNumber, party, narration: `Invoice ${inv.invoiceNumber}`, entries })
    );
  }

  for (const p of payments) {
    const inv = salesById.get(p.invoiceId);
    if (!inv) continue; // payment against a cancelled or missing invoice is not exported
    const bank = cashOrBank(p.mode);
    addMaster(bank, bank === "Cash" ? "Cash-in-Hand" : "Bank Accounts");
    vouchers.push(
      voucherXml({
        type: "Receipt",
        date: p.date,
        number: p.reference || `RCPT-${p.id.slice(-6)}`,
        party: inv.customerName,
        narration: `Received (${p.mode}) against ${inv.invoiceNumber}`,
        entries: [
          { ledger: bank, debit: true, amount: p.amount },
          { ledger: inv.customerName, debit: false, amount: p.amount },
        ],
      })
    );
  }

  for (const e of expenses) {
    const expenseLedger = e.category;
    addMaster(expenseLedger, "Indirect Expenses");
    const entries: Entry[] = [];
    let expenseAmount = e.taxableValue;
    const taxHeads = [
      ["Input CGST", e.cgst],
      ["Input SGST", e.sgst],
      ["Input IGST", e.igst],
    ] as const;
    if (e.itcEligible) {
      for (const [name, value] of taxHeads) {
        if (value) {
          addMaster(name, "Duties & Taxes");
          entries.push({ ledger: name, debit: true, amount: value });
        }
      }
    } else {
      expenseAmount = e.total; // GST that cannot be claimed is part of the cost
    }
    entries.unshift({ ledger: expenseLedger, debit: true, amount: expenseAmount });
    const paid = e.paymentStatus !== "UNPAID";
    const creditLedger = paid ? cashOrBank(e.paymentMode || "") : e.vendorName;
    addMaster(creditLedger, paid ? (creditLedger === "Cash" ? "Cash-in-Hand" : "Bank Accounts") : "Sundry Creditors");
    entries.push({ ledger: creditLedger, debit: false, amount: e.total });
    vouchers.push(
      voucherXml({
        type: paid ? "Payment" : "Journal",
        date: e.expenseDate,
        number: e.billNumber || `EXP-${e.id.slice(-6)}`,
        party: e.vendorName,
        narration: `${e.vendorName}${e.billNumber ? " bill " + e.billNumber : ""}`,
        entries,
      })
    );
  }

  const masterXml = [...masters].map(([name, parent]) => ledgerMaster(name, parent)).join("");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\r\n<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA>` +
    `<REQUESTDESC><REPORTNAME>All Masters</REPORTNAME></REQUESTDESC><REQUESTDATA>${masterXml}</REQUESTDATA></IMPORTDATA>` +
    `<IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>${vouchers.join("")}</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>`
  );
}
