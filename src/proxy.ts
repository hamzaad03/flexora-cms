import NextAuth from "next-auth";

import { authConfig } from "@/server/auth/config";

// Edge-safe proxy (Next 16 replacement for `middleware`): uses only the base
// config (no Prisma/bcrypt). The `authorized` callback gates the /admin area
// and redirects unauthenticated users to login.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy((req) => {
  // The `authorized` callback in authConfig handles allow/deny + redirect.
  void req;
});

export const config = {
  // Run on admin routes only; skip Next internals and static assets.
  matcher: ["/admin/:path*"],
};
