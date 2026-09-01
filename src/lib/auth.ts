import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/models/User";

/**
 * NextAuth v5 configuration.
 * Exports: auth, handlers, signIn, signOut
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "tzar_crm_super_secret_auth_key_2026_dev_mode_secret",
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Validate input schema
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);

        if (!parsed.success) {
          console.warn("Auth validation failed:", parsed.error.format());
          return null;
        }

        const { email, password } = parsed.data;

        // 2. Connect to DB and find user
        await dbConnect();
        const user = await User.findOne({ email: email.toLowerCase() }).select(
          "+passwordHash"
        );

        if (!user || !user.isActive) {
          console.warn("User not found or inactive:", email);
          return null;
        }

        // 3. Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          console.warn("Invalid password for user:", email);
          return null;
        }

        console.log("Auth success for user:", email, "role:", user.role, "allowedBusinesses:", user.allowedBusinesses);

        // Convert Mongoose CoreArray to plain JavaScript Array to satisfy structuredClone in jose JWT builder
        const cleanAllowedBusinesses: Array<"tzar" | "titepo" | "adshalaa" | "crownleaf"> = user.allowedBusinesses
          ? Array.from(user.allowedBusinesses).map(String) as any
          : ["tzar", "titepo", "adshalaa", "crownleaf"];

        // 4. Return user object — this goes into the JWT
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl ?? null,
          allowedBusinesses: cleanAllowedBusinesses,
        };
      },
    }),
  ],

  callbacks: {
    // Enrich JWT with custom fields on sign-in
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
        token.avatarUrl = (user as { avatarUrl: string | null }).avatarUrl;
        const raw = (user as { allowedBusinesses?: string[] }).allowedBusinesses;
        token.allowedBusinesses = raw
          ? Array.from(raw).map(String)
          : ["tzar", "titepo", "adshalaa", "crownleaf"];
      }
      return token;
    },

    // Expose custom fields on the session object
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.avatarUrl = token.avatarUrl as string | null;
        const tokenAllowed = token.allowedBusinesses as string[] | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).allowedBusinesses = tokenAllowed
          ? Array.from(tokenAllowed).map(String)
          : ["tzar", "titepo", "adshalaa", "crownleaf"];
      }
      return session;
    },
  },
});
