import type { NextAuthConfig } from "next-auth";

// Edge-safe base config. Contains NO Prisma or bcrypt so it can be imported by
// the proxy (edge runtime). The Credentials provider with its DB-backed
// `authorize` lives in ./index.ts (Node runtime only).
//
// The `authorized` callback gates the /admin area for the proxy/middleware.
// It MUST return true for the login page itself, otherwise NextAuth keeps
// redirecting the sign-in page to itself (infinite redirect loop).
export const authConfig = {
  // Trust the deployment host (behind a reverse proxy on VPS/shared hosting).
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  // Secure cookies in production (served over HTTPS).
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      // Always allow the login page (prevents redirect-to-self loops).
      if (pathname.startsWith("/admin/login")) return true;
      // Protect the rest of /admin.
      if (pathname.startsWith("/admin")) return !!auth?.user;
      return true;
    },
  },
} satisfies NextAuthConfig;
