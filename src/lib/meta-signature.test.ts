import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";
import { verifyMetaSignature } from "./meta-signature";

const sign = (body: string, secret: string) => "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

describe("verifyMetaSignature", () => {
  it("accepts a correct signature", () => {
    expect(verifyMetaSignature("{}", sign("{}", "s3cret"), "s3cret")).toBe(true);
  });
  it("rejects a wrong secret, tampered body, missing header or missing secret", () => {
    expect(verifyMetaSignature("{}", sign("{}", "other"), "s3cret")).toBe(false);
    expect(verifyMetaSignature("{ }", sign("{}", "s3cret"), "s3cret")).toBe(false);
    expect(verifyMetaSignature("{}", null, "s3cret")).toBe(false);
    expect(verifyMetaSignature("{}", sign("{}", "s3cret"), undefined)).toBe(false);
  });
});
