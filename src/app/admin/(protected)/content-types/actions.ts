"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import {
  createContentType,
  updateContentType,
  deleteContentType,
  addField,
  updateField,
  deleteField,
} from "@/server/services/content-type";
import {
  contentTypeInputSchema,
  fieldInputSchema,
} from "@/lib/validations/content";
import { logger } from "@/lib/logger";

export type CTResult = { ok: boolean; error?: string; id?: string };

export async function createContentTypeAction(raw: unknown): Promise<CTResult> {
  await requirePermission("content_types.manage");
  const parsed = contentTypeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const ct = await createContentType(parsed.data);
    revalidatePath("/admin/content-types");
    return { ok: true, id: ct.id };
  } catch (err) {
    logger.error({ err }, "Create content type failed");
    return { ok: false, error: "Failed to create content type." };
  }
}

export async function updateContentTypeAction(
  id: string,
  raw: unknown,
): Promise<CTResult> {
  await requirePermission("content_types.manage");
  const parsed = contentTypeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await updateContentType(id, parsed.data);
    revalidatePath("/admin/content-types");
    revalidatePath(`/admin/content-types/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Failed to update content type." };
  }
}

export async function deleteContentTypeAction(id: string): Promise<CTResult> {
  await requirePermission("content_types.manage");
  try {
    await deleteContentType(id);
    revalidatePath("/admin/content-types");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}

export async function addFieldAction(
  contentTypeId: string,
  raw: unknown,
): Promise<CTResult> {
  await requirePermission("content_types.manage");
  const parsed = fieldInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await addField(contentTypeId, parsed.data);
    revalidatePath(`/admin/content-types/${contentTypeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to add field." };
  }
}

export async function updateFieldAction(
  contentTypeId: string,
  fieldId: string,
  raw: unknown,
): Promise<CTResult> {
  await requirePermission("content_types.manage");
  const parsed = fieldInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await updateField(fieldId, parsed.data);
    revalidatePath(`/admin/content-types/${contentTypeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update field." };
  }
}

export async function deleteFieldAction(
  contentTypeId: string,
  fieldId: string,
): Promise<CTResult> {
  await requirePermission("content_types.manage");
  try {
    await deleteField(fieldId);
    revalidatePath(`/admin/content-types/${contentTypeId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete field." };
  }
}
