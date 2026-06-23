"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, requirePermission } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import {
  createEntry,
  updateEntry,
  deleteEntry,
  restoreRevision,
} from "@/server/services/content";
import { db } from "@/lib/db";
import { entryInputSchema, type EntryInput } from "@/lib/validations/content";
import { logger } from "@/lib/logger";

export type EntryActionResult = { ok: boolean; error?: string; id?: string };

// Users without content.publish cannot set a live status; coerce to DRAFT.
function coerceStatus(input: EntryInput, canPublish: boolean): EntryInput {
  if (!canPublish && input.status !== "DRAFT" && input.status !== "TRASHED") {
    return { ...input, status: "DRAFT" };
  }
  return input;
}

export async function createEntryAction(
  typeSlug: string,
  raw: unknown,
): Promise<EntryActionResult> {
  const user = await requirePermission("content.create");
  const parsed = entryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const canPublish = hasPermission(
    user.roles,
    user.permissions,
    "content.publish",
  );

  try {
    const entry = await createEntry(
      typeSlug,
      coerceStatus(parsed.data, canPublish),
      user.id,
    );
    revalidatePath(`/admin/content/${typeSlug}`);
    return { ok: true, id: entry.id };
  } catch (err) {
    logger.error({ err, typeSlug }, "Create entry failed");
    return { ok: false, error: "Failed to create entry." };
  }
}

export async function updateEntryAction(
  id: string,
  typeSlug: string,
  raw: unknown,
): Promise<EntryActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const entry = await db.contentEntry.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!entry) return { ok: false, error: "Entry not found." };

  // content.edit (any) OR content.edit_own when the user is the author.
  const canEditAny = hasPermission(
    user.roles,
    user.permissions,
    "content.edit",
  );
  const canEditOwn =
    hasPermission(user.roles, user.permissions, "content.edit_own") &&
    entry.authorId === user.id;
  if (!canEditAny && !canEditOwn) {
    return { ok: false, error: "You cannot edit this entry." };
  }

  const parsed = entryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const canPublish = hasPermission(
    user.roles,
    user.permissions,
    "content.publish",
  );

  try {
    await updateEntry(id, coerceStatus(parsed.data, canPublish), user.id);
    revalidatePath(`/admin/content/${typeSlug}`);
    revalidatePath(`/admin/content/${typeSlug}/${id}`);
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "Update entry failed");
    return { ok: false, error: "Failed to save entry." };
  }
}

export async function deleteEntryAction(
  id: string,
  typeSlug: string,
): Promise<EntryActionResult> {
  await requirePermission("content.delete");
  try {
    await deleteEntry(id);
    revalidatePath(`/admin/content/${typeSlug}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete entry." };
  }
}

export async function restoreRevisionAction(
  revisionId: string,
  typeSlug: string,
  entryId: string,
): Promise<EntryActionResult> {
  const user = await requirePermission("content.edit");
  try {
    await restoreRevision(revisionId, user.id);
    revalidatePath(`/admin/content/${typeSlug}/${entryId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to restore revision." };
  }
}
