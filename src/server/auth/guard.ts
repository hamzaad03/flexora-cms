import { redirect } from "next/navigation";

import { auth } from "./index";
import { hasPermission, type PermissionSlug } from "@/lib/rbac";

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  roles: string[];
  permissions: string[];
};

/** Returns the current session user, or null if not authenticated. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

/** Pure check against the current session. */
export async function can(permission: PermissionSlug): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return hasPermission(user.roles, user.permissions, permission);
}

/** Require authentication; redirect to login otherwise. Returns the user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/**
 * Require a specific permission for a server action / page / route handler.
 * Redirects unauthenticated users to login and sends authenticated-but-
 * unauthorized users to the admin "forbidden" page.
 */
export async function requirePermission(
  permission: PermissionSlug,
): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.roles, user.permissions, permission)) {
    redirect("/admin/forbidden");
  }
  return user;
}
