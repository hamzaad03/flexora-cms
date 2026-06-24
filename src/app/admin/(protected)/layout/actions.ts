"use server";

import { revalidatePath } from "next/cache";
import type { LayoutAreaType } from "@prisma/client";

import { requirePermission } from "@/server/auth/guard";
import {
  createArea,
  updateArea,
  deleteArea,
  setAssignments,
} from "@/server/services/layout";
import { invalidateThemeCache } from "@/server/theme/engine";
import type { AreaSettings, LayoutContent } from "@/lib/layout-types";
import { logger } from "@/lib/logger";

export type LayoutResult = { ok: boolean; error?: string; id?: string };

export async function createAreaAction(
  type: LayoutAreaType,
  name: string,
): Promise<LayoutResult> {
  await requirePermission("layout.manage");
  if (!name.trim()) return { ok: false, error: "Name is required." };
  try {
    const area = await createArea({ type, name: name.trim() });
    revalidatePath("/admin/layout");
    return { ok: true, id: area.id };
  } catch {
    return { ok: false, error: "Failed to create." };
  }
}

export async function saveAreaAction(
  id: string,
  input: {
    name: string;
    status: boolean;
    content: LayoutContent;
    settings: AreaSettings;
  },
): Promise<LayoutResult> {
  await requirePermission("layout.manage");
  try {
    await updateArea(id, input);
    invalidateThemeCache();
    revalidatePath("/admin/layout");
    revalidatePath(`/admin/layout/${id}`);
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "Save layout area failed");
    return { ok: false, error: "Failed to save." };
  }
}

export async function saveAssignmentsAction(
  id: string,
  input: { isDefault: boolean; contentTypeIds: string[]; entryIds: string[] },
): Promise<LayoutResult> {
  await requirePermission("layout.manage");
  try {
    await setAssignments(id, input);
    invalidateThemeCache();
    revalidatePath(`/admin/layout/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save assignments." };
  }
}

export async function deleteAreaAction(id: string): Promise<LayoutResult> {
  await requirePermission("layout.manage");
  try {
    await deleteArea(id);
    revalidatePath("/admin/layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete." };
  }
}
