import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

// Edge-safe proxy (Next 16 replacement for `middleware`): uses only the base
// config (no Prisma/bcrypt). Gating is driven by the `authorized` callback in
// authConfig — we export the middleware directly (no custom wrapper) so that
// callback governs, which keeps the login page exempt from redirects.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on admin routes only; skip Next internals and static assets.
  matcher: ["/admin/:path*"],
};
