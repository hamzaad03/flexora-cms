import "server-only";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { PERMISSIONS, ROLES, SUPER_ADMIN_ROLE } from "@/lib/rbac";

/**
 * Sync the canonical roles & permissions (from src/lib/rbac.ts) into the DB.
 * Idempotent — used by the first-run setup wizard so the system is usable even
 * before `db:seed` is run.
 */
export async function syncRolesAndPermissions(): Promise<void> {
  for (const [slug, def] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({
      where: { slug },
      update: { name: def.name, group: def.group },
      create: { slug, name: def.name, group: def.group },
    });
  }

  const allPermissions = await db.permission.findMany();
  const bySlug = new Map(allPermissions.map((p) => [p.slug, p.id]));

  for (const [slug, def] of Object.entries(ROLES)) {
    const role = await db.role.upsert({
      where: { slug },
      update: { name: def.name, description: def.description, isSystem: true },
      create: {
        slug,
        name: def.name,
        description: def.description,
        isSystem: true,
      },
    });

    const permSlugs =
      def.permissions === "*"
        ? Object.keys(PERMISSIONS)
        : (def.permissions as string[]);

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({
      data: permSlugs
        .map((ps) => bySlug.get(ps))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
}

/** True once at least one user account exists (i.e. setup is complete). */
export async function isSetupComplete(): Promise<boolean> {
  const count = await db.user.count();
  return count > 0;
}

/**
 * Create the first Super Admin. Ensures base RBAC data exists first.
 * Refuses to run if any user already exists.
 */
export async function createFirstAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ id: string }> {
  if (await isSetupComplete()) {
    throw new Error("Setup has already been completed.");
  }

  await syncRolesAndPermissions();

  const role = await db.role.findUnique({
    where: { slug: SUPER_ADMIN_ROLE },
  });
  if (!role) throw new Error("Super Admin role missing after sync.");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      isActive: true,
      roles: { create: { roleId: role.id } },
    },
  });

  return { id: user.id };
}
