/**
 * NextAuth v5 Edge-compatible Auth export.
 * This file ONLY exports what's safe for the Edge runtime (middleware).
 * Mongoose and bcryptjs are NOT imported here — those stay in auth.ts (Node.js runtime only).
 */
import NextAuth from "next-auth";

export const { auth } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "tzar_crm_super_secret_auth_key_2026_dev_mode_secret",
  session: { strategy: "jwt" },
  providers: [], // Providers not needed in edge — only for session reading
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
});
