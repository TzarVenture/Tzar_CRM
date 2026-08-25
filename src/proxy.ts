import { auth } from "@/lib/auth-edge";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * RBAC Proxy (Next.js 16+) — replaces middleware.ts convention.
 * Edge Runtime compatible — uses auth-edge.ts (no mongoose/bcryptjs).
 * Full auth logic (credentials validation) stays in auth.ts (Node.js runtime).
 */
export default auth(function proxy(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ─── 1. Always allow: ingest gateway, webhook & NextAuth endpoints ────────
  if (
    pathname.startsWith("/api/v1/ingest") ||
    pathname.startsWith("/api/v1/webhooks") ||
    pathname.startsWith("/api/v1/meta") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/seed")
  ) {
    return NextResponse.next();
  }

  // ─── 2. Always allow: client portal ───────────────────────────────────────
  if (pathname.startsWith("/portal")) {
    return NextResponse.next();
  }

  // ─── 3. Login / forgot-password pages ─────────────────────────────────────
  if (pathname.startsWith("/login") || pathname.startsWith("/forgot-password")) {
    if (session) {
      const role = session.user?.role;
      const redirectTo =
        role === "BDE" ? "/pipeline" : role === "CLIENT" ? "/portal" : "/";
      return NextResponse.redirect(new URL(redirectTo, req.url));
    }
    return NextResponse.next();
  }

  // ─── 4. Block unauthenticated access ──────────────────────────────────────
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // ─── 5. Settings — SUPER_ADMIN only ───────────────────────────────────────
  if (pathname.startsWith("/settings") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/pipeline", req.url));
  }

  // ─── 6. Meta Ads — blocked for CLIENT ────────────────────────────────────
  if (pathname.startsWith("/meta-ads") && role === "CLIENT") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── 7. Unauthenticated API calls ────────────────────────────────────────
  if (pathname.startsWith("/api/") && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
