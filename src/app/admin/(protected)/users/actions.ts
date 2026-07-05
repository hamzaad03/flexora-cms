"use server";

import { revalidatePath } from "next/cache";

import { requirePermission, requireUser } from "@/server/auth/guard";
import {
  changeOwnPassword,
  createRole,
  createUser,
  deleteRole,
  deleteUser,
  getUserForAdmin,
  updateAccount,
  updateRole,
  updateUser,
  resetUserPassword,
  UserManagementError,
  type UserActor,
} from "@/server/services/users";
import {
  accountInputSchema,
  ownPasswordInputSchema,
  passwordResetInputSchema,
  roleInputSchema,
  userCreateInputSchema,
  userUpdateInputSchema,
} from "@/lib/validations/users";
import { logger } from "@/lib/logger";

export type UserActionResult = { ok: boolean; error?: string; id?: string };

function actionError(err: unknown, fallback: string) {
  if (err instanceof UserManagementError) return err.message;
  logger.error({ err }, fallback);
  return fallback;
}

async function requireUserManager(): Promise<UserActor> {
  const user = await requirePermission("users.manage");
  return { id: user.id, roles: user.roles };
}

export async function createUserAction(
  raw: unknown,
): Promise<UserActionResult> {
  const actor = await requireUserManager();
  const parsed = userCreateInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const user = await createUser(parsed.data, actor);
    revalidatePath("/admin/users");
    return { ok: true, id: user.id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to create user.") };
  }
}

export async function updateUserAction(
  id: string,
  raw: unknown,
): Promise<UserActionResult> {
  const actor = await requireUserManager();
  const parsed = userUpdateInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await updateUser(id, parsed.data, actor);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to update user.") };
  }
}

export async function setUserActiveAction(
  id: string,
  isActive: boolean,
): Promise<UserActionResult> {
  const actor = await requireUserManager();
  const user = await getUserForAdmin(id);
  if (!user) return { ok: false, error: "User not found." };
  try {
    await updateUser(
      id,
      {
        name: user.name,
        email: user.email,
        isActive,
        roles: user.roles.map((r) => r.role.slug),
      },
      actor,
    );
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to update user.") };
  }
}

export async function resetUserPasswordAction(
  id: string,
  raw: unknown,
): Promise<UserActionResult> {
  const actor = await requireUserManager();
  const parsed = passwordResetInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await resetUserPassword(id, parsed.data, actor);
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to reset password.") };
  }
}

export async function deleteUserAction(id: string): Promise<UserActionResult> {
  const actor = await requireUserManager();
  try {
    await deleteUser(id, actor);
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to delete user.") };
  }
}

export async function saveRoleAction(
  id: string | null,
  raw: unknown,
): Promise<UserActionResult> {
  const actor = await requireUserManager();
  const parsed = roleInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const role = id
      ? await updateRole(id, parsed.data, actor)
      : await createRole(parsed.data, actor);
    revalidatePath("/admin/users/roles");
    return { ok: true, id: role.id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to save role.") };
  }
}

export async function deleteRoleAction(id: string): Promise<UserActionResult> {
  const actor = await requireUserManager();
  try {
    await deleteRole(id, actor);
    revalidatePath("/admin/users/roles");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to delete role.") };
  }
}

export async function updateAccountAction(
  raw: unknown,
): Promise<UserActionResult> {
  const user = await requireUser();
  const parsed = accountInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await updateAccount(user.id, parsed.data);
    revalidatePath("/admin/account");
    return { ok: true, id: user.id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to update account.") };
  }
}

export async function changeOwnPasswordAction(
  raw: unknown,
): Promise<UserActionResult> {
  const user = await requireUser();
  const parsed = ownPasswordInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await changeOwnPassword(user.id, parsed.data);
    return { ok: true, id: user.id };
  } catch (err) {
    return { ok: false, error: actionError(err, "Failed to change password.") };
  }
}
