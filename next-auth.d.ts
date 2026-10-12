import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/server/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      location: string | null;
      organization: string | null;
      bio: string | null;
      navigatorVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    location?: string | null;
    organization?: string | null;
    bio?: string | null;
    navigatorVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    location?: string | null;
    organization?: string | null;
    bio?: string | null;
    navigatorVerified?: boolean;
  }
}
