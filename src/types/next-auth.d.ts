import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "owner";
      studioId: string;
    };
  }

  interface User {
    role: "owner";
    studioId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "owner";
    studioId?: string;
  }
}
