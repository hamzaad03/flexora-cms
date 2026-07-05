import "server-only";

import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  type AccountInput,
  type OwnPasswordInput,
  type PasswordResetInput,
  type RoleInput,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/lib/validations/users";
import { hooks, HOOKS } from "@/server/hooks";
import { ensurePluginsLoaded } from "./plugins";
import {
  assertNotSelfTarget,
  assertSelfMutationSafe,
  isSelfTarget,
  isSuperAdmin,
  shouldProtectLastSuperAdmin,
  UserManagementError,
} from "@/lib/user-guards";

export {
  assertNotSelfTarget,
  assertSelfMutationSafe,
  isSelfTarget,
  isSuperAdmin,
  shouldProtectLastSuperAdmin,
  UserManagementError,
} from "@/lib/user-guards";

export type UserActor = {
  id: string;
  roles: string[];
};

async function roleSlugsHaveAdminAccess(roleSlugs: string[]) {
  if (roleSlugs.includes("super-admin")) return true;
  const count = await db.role.count({
    where: {
      slug: { in: roleSlugs },
      permissions: {
        some: { permission: { slug: "users.manage" } },
      },
    },
  });
  return count > 0;
}

async function assertCanAssignRoles(actor: UserActor, roleSlugs: string[]) {
  if (roleSlugs.includes("super-admin") && !isSuperAdmin(actor)) {
    throw new UserManagementError("Only Super Admins can assign Super Admin.");
  }
}

async function assertLastSuperAdminSafe(
  targetId: string,
  next: { isActive: boolean; roleSlugs: string[] },
) {
  const current = await db.user.findUnique({
    where: { id: targetId },
    select: {
      isActive: true,
      roles: { select: { role: { select: { slug: true } } } },
    },
  });
  if (!current) throw new UserManagementError("User not found.");

  const otherActiveSuperAdmins = await db.user.count({
    where: {
      id: { not: targetId },
      isActive: true,
      roles: { some: { role: { slug: "super-admin" } } },
    },
  });
  if (
    shouldProtectLastSuperAdmin(
      {
        isActive: current.isActive,
        roleSlugs: current.roles.map((r) => r.role.slug),
      },
      next,
      otherActiveSuperAdmins,
    )
  ) {
    throw new UserManagementError(
      "At least one active Super Admin is required.",
    );
  }
}

export async function assertUserMutationAllowed(
  actor: UserActor,
  targetId: string,
  next: { isActive: boolean; roleSlugs: string[] },
) {
  await assertCanAssignRoles(actor, next.roleSlugs);
  await assertLastSuperAdminSafe(targetId, next);
  if (isSelfTarget(actor.id, targetId)) {
    const keepsAdminAccess = await roleSlugsHaveAdminAccess(next.roleSlugs);
    assertSelfMutationSafe(actor.id, targetId, {
      isActive: next.isActive,
      keepsAdminAccess,
    });
  }
}

async function getRolesBySlug(slugs: string[]) {
  const unique = Array.from(new Set(slugs));
  const roles = await db.role.findMany({ where: { slug: { in: unique } } });
  if (roles.length !== unique.length) {
    throw new UserManagementError("One or more roles do not exist.");
  }
  return roles;
}

async function replaceUserRoles(userId: string, roleSlugs: string[]) {
  const roles = await getRolesBySlug(roleSlugs);
  await db.userRole.deleteMany({ where: { userId } });
  await db.userRole.createMany({
    data: roles.map((role) => ({ userId, roleId: role.id })),
    skipDuplicates: true,
  });
}

export type ListUsersOptions = {
  q?: string;
  role?: string;
  status?: "active" | "inactive" | "all";
  take?: number;
  skip?: number;
};

export async function listUsers(opts: ListUsersOptions = {}) {
  const where: Prisma.UserWhereInput = {
    ...(opts.q
      ? {
          OR: [{ name: { contains: opts.q } }, { email: { contains: opts.q } }],
        }
      : {}),
    ...(opts.status && opts.status !== "all"
      ? { isActive: opts.status === "active" }
      : {}),
    ...(opts.role && opts.role !== "all"
      ? { roles: { some: { role: { slug: opts.role } } } }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      include: {
        roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
        _count: { select: { authoredEntries: true } },
      },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 25,
      skip: opts.skip ?? 0,
    }),
    db.user.count({ where }),
  ]);
  return { items, total };
}

export async function listRolesForAdmin() {
  return db.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });
}

export async function listPermissionsForAdmin() {
  const rows = await db.permission.findMany({
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });
  return rows.reduce<Record<string, typeof rows>>((acc, permission) => {
    const group = permission.group ?? "Other";
    (acc[group] ??= []).push(permission);
    return acc;
  }, {});
}

export async function getUserForAdmin(id: string) {
  return db.user.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
      authoredEntries: {
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function getCurrentAccount(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      roles: { include: { role: true }, orderBy: { role: { name: "asc" } } },
    },
  });
}

export async function createUser(input: UserCreateInput, actor: UserActor) {
  await assertCanAssignRoles(actor, input.roles);
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) throw new UserManagementError("A user with this email exists.");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await db.user.create({
    data: {
      email: input.email,
      name: input.name || null,
      passwordHash,
      isActive: input.isActive,
    },
  });
  await replaceUserRoles(user.id, input.roles);

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.userAfterSave, user);
  logger.info({ userId: user.id, actorId: actor.id }, "User created");
  return user;
}

export async function updateUser(
  id: string,
  input: UserUpdateInput,
  actor: UserActor,
) {
  await assertUserMutationAllowed(actor, id, {
    isActive: input.isActive,
    roleSlugs: input.roles,
  });

  const emailOwner = await db.user.findUnique({
    where: { email: input.email },
  });
  if (emailOwner && emailOwner.id !== id) {
    throw new UserManagementError("A user with this email exists.");
  }

  const user = await db.user.update({
    where: { id },
    data: {
      email: input.email,
      name: input.name || null,
      isActive: input.isActive,
    },
  });
  await replaceUserRoles(id, input.roles);

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.userAfterSave, user);
  logger.info({ userId: id, actorId: actor.id }, "User updated");
  return user;
}

export async function resetUserPassword(
  id: string,
  input: PasswordResetInput,
  actor: UserActor,
) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  await db.user.update({ where: { id }, data: { passwordHash } });
  logger.info({ userId: id, actorId: actor.id }, "User password reset");
}

export async function deleteUser(id: string, actor: UserActor) {
  assertNotSelfTarget(actor.id, id, "delete");
  const target = await db.user.findUnique({
    where: { id },
    select: {
      isActive: true,
      roles: { select: { role: { select: { slug: true } } } },
    },
  });
  if (!target) throw new UserManagementError("User not found.");
  await assertLastSuperAdminSafe(id, { isActive: false, roleSlugs: [] });
  await db.user.delete({ where: { id } });

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.userAfterDelete, { id });
  logger.info({ userId: id, actorId: actor.id }, "User deleted");
}

export async function updateAccount(id: string, input: AccountInput) {
  return db.user.update({
    where: { id },
    data: { name: input.name || null },
  });
}

export async function changeOwnPassword(id: string, input: OwnPasswordInput) {
  const user = await db.user.findUnique({ where: { id } });
  if (!user?.passwordHash) {
    throw new UserManagementError(
      "Password cannot be changed for this account.",
    );
  }
  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) throw new UserManagementError("Current password is incorrect.");
  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await db.user.update({ where: { id }, data: { passwordHash } });
}

async function replaceRolePermissions(
  roleId: string,
  permissionSlugs: string[],
) {
  const unique = Array.from(new Set(permissionSlugs));
  const permissions = await db.permission.findMany({
    where: { slug: { in: unique } },
  });
  if (permissions.length !== unique.length) {
    throw new UserManagementError("One or more permissions do not exist.");
  }
  await db.rolePermission.deleteMany({ where: { roleId } });
  await db.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });
}

export async function createRole(input: RoleInput, actor: UserActor) {
  const existing = await db.role.findUnique({ where: { slug: input.slug } });
  if (existing) throw new UserManagementError("A role with this slug exists.");
  const role = await db.role.create({
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      isSystem: false,
    },
  });
  await replaceRolePermissions(role.id, input.permissions);

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.roleAfterSave, role);
  logger.info({ roleId: role.id, actorId: actor.id }, "Role created");
  return role;
}

export async function updateRole(
  id: string,
  input: RoleInput,
  actor: UserActor,
) {
  const existing = await db.role.findUnique({ where: { id } });
  if (!existing) throw new UserManagementError("Role not found.");
  if (existing.isSystem) {
    throw new UserManagementError("System roles cannot be edited.");
  }
  if (input.slug !== existing.slug) {
    const slugOwner = await db.role.findUnique({ where: { slug: input.slug } });
    if (slugOwner)
      throw new UserManagementError("A role with this slug exists.");
  }
  const role = await db.role.update({
    where: { id },
    data: {
      slug: input.slug,
      name: input.name,
      description: input.description || null,
    },
  });
  await replaceRolePermissions(role.id, input.permissions);

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.roleAfterSave, role);
  logger.info({ roleId: id, actorId: actor.id }, "Role updated");
  return role;
}

export async function deleteRole(id: string, actor: UserActor) {
  const role = await db.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) throw new UserManagementError("Role not found.");
  if (role.isSystem)
    throw new UserManagementError("System roles cannot be deleted.");
  if (role._count.users > 0) {
    throw new UserManagementError(
      "Remove this role from users before deleting it.",
    );
  }
  await db.role.delete({ where: { id } });

  await ensurePluginsLoaded();
  await hooks.doAction(HOOKS.roleAfterDelete, role);
  logger.info({ roleId: id, actorId: actor.id }, "Role deleted");
}
