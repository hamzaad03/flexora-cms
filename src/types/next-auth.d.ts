import type { DefaultSession } from "next-auth";

// Augment Auth.js types with our RBAC fields.
declare module "next-auth" {
  interface User {
    roles?: string[];
    permissions?: string[];
  }

  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    roles?: string[];
    permissions?: string[];
  }
}
