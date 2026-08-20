/**
 * NextAuth v5 Route Handler
 * Handles all /api/auth/* requests (signin, signout, session, csrf, etc.)
 * 
 * The explicit type cast resolves the Next.js 16 strict route handler constraint
 * with next-auth@beta's AppRouteHandlers type.
 */
import { handlers } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const GET = (req: NextRequest) => handlers.GET(req);
export const POST = (req: NextRequest) => handlers.POST(req);
