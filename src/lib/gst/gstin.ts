/**
 * GSTIN validation shared by invoices and expenses.
 *
 * A GSTIN is 15 characters: 2-digit state code, 10-character PAN, entity
 * number, the letter Z, and a check character. The check character catches
 * almost every typing mistake, so it is verified as well as the format.
 */

export const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const CODE_POINTS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Check character for the first 14 characters of a GSTIN (Luhn mod 36). */
export function gstinCheckCharacter(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = CODE_POINTS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(value / 36) + (value % 36);
  }
  return CODE_POINTS[(36 - (sum % 36)) % 36];
}

export type GstinProblem = "format" | "checksum" | null;

/** Returns what is wrong with a GSTIN, or null when it is valid. */
export function checkGstin(gstin: string): GstinProblem {
  if (!GSTIN_FORMAT.test(gstin)) return "format";
  if (gstinCheckCharacter(gstin.slice(0, 14)) !== gstin[14]) return "checksum";
  return null;
}

export function gstinProblemMessage(problem: GstinProblem, label = "GSTIN"): string {
  if (problem === "format") return `${label} must be 15 characters in the format 27ABCDE1234F1Z5`;
  if (problem === "checksum") return `${label} looks mistyped (its check character does not match). Please re-check it`;
  return "";
}
