import { timingSafeEqual } from "crypto";

import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

import { env } from "@/lib/env";

function matchesSecret(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // Still run a dummy comparison to avoid leaking length via timing
    timingSafeEqual(a, Buffer.alloc(a.length));
    return false;
  }
  return timingSafeEqual(a, b);
}

type CredentialsInput = {
  email?: string;
  password?: string;
};

export async function authorizeStudioOwner(credentials?: CredentialsInput) {
  if (!credentials) {
    return null;
  }

  const email = credentials.email?.trim().toLowerCase() ?? "";
  const password = credentials.password?.trim() ?? "";

  // Evaluate both comparisons unconditionally to avoid leaking which field is wrong
  const isEmailMatch = matchesSecret(email, env.STUDIO_OWNER_EMAIL);
  const isPasswordMatch = matchesSecret(password, env.STUDIO_OWNER_PASSWORD);

  if (!email || !password || !isEmailMatch || !isPasswordMatch) {
    return null;
  }

  return {
    id: "studio-owner",
    email,
    role: "owner" as const,
    studioId: "default-studio",
  };
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Studio Owner",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        return authorizeStudioOwner(credentials);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.studioId = user.studioId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (!token.sub || !token.role || !token.studioId) {
          return { ...session, user: undefined as never };
        }
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.studioId = token.studioId;
      }

      return session;
    },
  },
};
