import type { NextAuthConfig } from "next-auth";

// Edge-safe base config. Contains NO Prisma or bcrypt so it can be imported by
// middleware (edge runtime). The Credentials provider with its DB-backed
// `authorize` lives in ./index.ts (Node runtime only).
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // Used by middleware to gate the /admin area.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        if (pathname.startsWith("/admin/login")) return true;
        return isLoggedIn;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
