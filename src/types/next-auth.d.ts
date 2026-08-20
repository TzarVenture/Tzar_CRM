import { DefaultSession, DefaultJWT } from "next-auth";
import type { UserRole } from "@/models/User";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      avatarUrl: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    avatarUrl: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    avatarUrl: string | null;
  }
}
