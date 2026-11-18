import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verifies Meta's X-Hub-Signature-256 header ("sha256=<hex>") against the raw
 * request body using the app secret. Without this, anyone who knows the
 * webhook URL can inject fake leads.
 */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string | undefined): boolean {
  if (!appSecret || !header || !header.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const supplied = header.slice("sha256=".length);
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}
