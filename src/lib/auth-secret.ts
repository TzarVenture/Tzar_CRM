/**
 * The signing secret for login sessions. There is deliberately NO fallback:
 * a secret that lives in the source code is public, and anyone holding it can
 * forge an admin session. Production must set AUTH_SECRET.
 */
export function getAuthSecret(): string | undefined {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("AUTH_SECRET is not set");
  }
  // In local dev with no secret, NextAuth reports a clear error itself.
  return secret;
}
