/** Month helpers. Dates are handled in UTC so a month never shifts with the server's timezone. */

export const MONTH_FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

/** "2026-11" gives [1 Nov 2026, 1 Dec 2026). */
export function monthRange(month: string): { start: Date; end: Date } {
  if (!MONTH_FORMAT.test(month)) throw new Error("Month must look like 2026-11");
  const [y, m] = month.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}

/** Financial year (April to March) as a date range. */
export function financialYearRange(startYear: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(startYear, 3, 1)), end: new Date(Date.UTC(startYear + 1, 3, 1)) };
}

/** Start year of the financial year containing the date. */
export function financialYearStart(date: Date): number {
  return date.getUTCMonth() >= 3 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatDMY(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}-${m}-${date.getUTCFullYear()}`;
}

/** "all", "month:2026-11" or "fy:2026" (April 2026 to March 2027) as a range; null means all time. */
export function parsePeriod(value: string | null): { start: Date; end: Date } | null | "invalid" {
  if (!value || value === "all") return null;
  const [kind, arg] = value.split(":");
  if (kind === "month" && MONTH_FORMAT.test(arg || "")) return monthRange(arg);
  if (kind === "fy" && /^\d{4}$/.test(arg || "")) return financialYearRange(Number(arg));
  return "invalid";
}
