import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { requireServerEnv } from "./src/config/env.server.ts";
import { authenticateCredentials } from "./src/server/auth/login-service.ts";
import { loadUserSessionAuthority, validateSessionToken } from "./src/server/auth/session-authority.ts";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: requireServerEnv("AUTH_SECRET"),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => authenticateCredentials({
        email: credentials?.email,
        password: credentials?.password,
      }),
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return null;

      if (user?.id) {
        const authority = await loadUserSessionAuthority(user.id);
        return authority
          ? { sub: authority.user.id, sessionVersion: authority.credentials.sessionVersion }
          : null;
      }

      const authority = await validateSessionToken({ sub: userId, sessionVersion: token.sessionVersion });
      return authority
        ? { sub: authority.user.id, sessionVersion: authority.credentials.sessionVersion }
        : null;
    },
    async session({ session, token }) {
      const authority = await validateSessionToken({ sub: token.sub, sessionVersion: token.sessionVersion });
      if (!authority) return { ...session, user: undefined };

      session.user.id = authority.user.id;
      return session;
    },
  },
});
