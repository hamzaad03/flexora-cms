"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import { createForm, updateForm, deleteForm } from "@/server/services/forms";
import { formInputSchema } from "@/lib/validations/forms";
import { logger } from "@/lib/logger";

export type FormResult = { ok: boolean; error?: string; id?: string };

export async function createFormAction(raw: unknown): Promise<FormResult> {
  await requirePermission("forms.manage");
  const parsed = formInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    const form = await createForm(parsed.data);
    revalidatePath("/admin/forms");
    return { ok: true, id: form.id };
  } catch (err) {
    logger.error({ err }, "Create form failed");
    return { ok: false, error: "Failed to create form." };
  }
}

export async function updateFormAction(
  id: string,
  raw: unknown,
): Promise<FormResult> {
  await requirePermission("forms.manage");
  const parsed = formInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  try {
    await updateForm(id, parsed.data);
    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${id}`);
    return { ok: true, id };
  } catch {
    return { ok: false, error: "Failed to save form." };
  }
}

export async function deleteFormAction(id: string): Promise<FormResult> {
  await requirePermission("forms.manage");
  try {
    await deleteForm(id);
    revalidatePath("/admin/forms");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete form." };
  }
}
