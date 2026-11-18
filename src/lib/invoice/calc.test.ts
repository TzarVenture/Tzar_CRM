import { describe, expect, it } from "vitest";
import { amountInWords, computeInvoice, round2, summarizeByHsn } from "./calc";

const base = { sellerStateCode: "27", pricesIncludeTax: false };

describe("computeInvoice", () => {
  it("splits tax into equal CGST and SGST for a sale within the seller's state", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [{ description: "Boxes", quantity: 30, rate: 240, gstRate: 18 }],
    });
    // Figures taken from a real supplier bill
    expect(result.isInterState).toBe(false);
    expect(result.totals).toMatchObject({
      taxableValue: 7200,
      cgst: 648,
      sgst: 648,
      igst: 0,
      totalTax: 1296,
      roundOff: 0,
      grandTotal: 8496,
    });
  });

  it("charges the whole rate as IGST for a sale to another state", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "06",
      items: [{ description: "Boxes", quantity: 30, rate: 240, gstRate: 18 }],
    });
    expect(result.isInterState).toBe(true);
    expect(result.totals).toMatchObject({ cgst: 0, sgst: 0, igst: 1296, grandTotal: 8496 });
  });

  it("matches the hamper invoice the business issued by hand", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [
        { description: "Category A", quantity: 10, rate: 8500, gstRate: 18 },
        { description: "Category B", quantity: 22, rate: 4500, gstRate: 18 },
        { description: "Category C", quantity: 14, rate: 2000, gstRate: 18 },
      ],
    });
    expect(result.totals).toMatchObject({ taxableValue: 212000, cgst: 19080, sgst: 19080, grandTotal: 250160 });
    expect(result.amountInWords).toBe("Rupees Two Lakh Fifty Thousand One Hundred Sixty Only");
  });

  it("applies the line discount before tax", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [{ description: "Retainer", quantity: 1, rate: 45000, discountPercent: 10, gstRate: 18 }],
    });
    expect(result.items[0]).toMatchObject({ taxableValue: 40500, cgst: 3645, sgst: 3645, lineTotal: 47790 });
    expect(result.totals.discount).toBe(4500);
  });

  it("backs the tax out of the price when rates include GST", () => {
    const result = computeInvoice({
      sellerStateCode: "27",
      customerStateCode: "27",
      pricesIncludeTax: true,
      items: [{ description: "Toy", quantity: 1, rate: 1180, gstRate: 18 }],
    });
    expect(result.items[0]).toMatchObject({ taxableValue: 1000, cgst: 90, sgst: 90, lineTotal: 1180 });
    expect(result.totals.grandTotal).toBe(1180);
  });

  it("never lets inclusive pricing drift from the price the customer was quoted", () => {
    const result = computeInvoice({
      sellerStateCode: "27",
      customerStateCode: "27",
      pricesIncludeTax: true,
      items: [{ description: "Toy", quantity: 3, rate: 349, gstRate: 12 }],
    });
    const item = result.items[0];
    expect(round2(item.taxableValue + item.cgst + item.sgst)).toBe(1047);
  });

  it("rounds the grand total to the nearest rupee and reports the difference", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "06",
      items: [{ description: "Service", quantity: 1, rate: 85000.4, gstRate: 18 }],
    });
    expect(result.totals.igst).toBe(15300.07);
    expect(result.totals.grandTotal).toBe(100300);
    expect(result.totals.roundOff).toBe(-0.47);
    expect(round2(result.totals.taxableValue + result.totals.totalTax + result.totals.roundOff)).toBe(
      result.totals.grandTotal
    );
  });

  it("charges no tax on a 0% line", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [{ description: "Exempt", quantity: 2, rate: 500, gstRate: 0 }],
    });
    expect(result.totals).toMatchObject({ taxableValue: 1000, totalTax: 0, grandTotal: 1000 });
  });

  it("treats bad numbers as zero instead of producing NaN", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [{ description: "Blank", quantity: Number.NaN, rate: Number.NaN, gstRate: Number.NaN }],
    });
    expect(result.totals.grandTotal).toBe(0);
  });

  it("clamps a discount above 100% so a line can never go negative", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [{ description: "Free", quantity: 1, rate: 100, discountPercent: 150, gstRate: 18 }],
    });
    expect(result.totals.grandTotal).toBe(0);
  });
});

describe("summarizeByHsn", () => {
  it("adds up lines that share an HSN code and rate, keeping other rates separate", () => {
    const { items } = computeInvoice({
      ...base,
      customerStateCode: "27",
      items: [
        { description: "A", hsnSac: "481920", quantity: 10, rate: 8500, gstRate: 18 },
        { description: "B", hsnSac: "481920", quantity: 22, rate: 4500, gstRate: 18 },
        { description: "C", hsnSac: "0802", quantity: 14, rate: 2000, gstRate: 5 },
      ],
    });
    expect(summarizeByHsn(items)).toEqual([
      { hsnSac: "481920", gstRate: 18, taxableValue: 184000, cgst: 16560, sgst: 16560, igst: 0, taxAmount: 33120 },
      { hsnSac: "0802", gstRate: 5, taxableValue: 28000, cgst: 700, sgst: 700, igst: 0, taxAmount: 1400 },
    ]);
  });

  it("totals to the same tax as the invoice", () => {
    const result = computeInvoice({
      ...base,
      customerStateCode: "06",
      items: [
        { description: "A", hsnSac: "998361", quantity: 1, rate: 33333.33, gstRate: 18 },
        { description: "B", hsnSac: "998314", quantity: 3, rate: 1111.11, gstRate: 12 },
      ],
    });
    const summed = summarizeByHsn(result.items).reduce((sum, row) => round2(sum + row.taxAmount), 0);
    expect(summed).toBe(result.totals.totalTax);
  });
});

describe("amountInWords", () => {
  it.each([
    [0, "Rupees Zero Only"],
    [15, "Rupees Fifteen Only"],
    [8496, "Rupees Eight Thousand Four Hundred Ninety Six Only"],
    [100000, "Rupees One Lakh Only"],
    [12345678, "Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight Only"],
    [22590.07, "Rupees Twenty Two Thousand Five Hundred Ninety and Seven Paise Only"],
  ])("writes %s as %s", (amount, words) => {
    expect(amountInWords(amount)).toBe(words);
  });
});
