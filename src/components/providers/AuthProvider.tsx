"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

/** The server passes in the session it already has, so menus render correctly on the first paint. */
export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
