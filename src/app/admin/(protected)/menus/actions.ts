"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import {
  createMenu,
  saveMenuTree,
  type MenuTreeNode,
} from "@/server/services/menu";
import { invalidateThemeCache } from "@/server/theme/engine";

export type MenuResult = { ok: boolean; error?: string; id?: string };

export async function createMenuAction(name: string): Promise<MenuResult> {
  await requirePermission("menus.manage");
  if (!name.trim()) return { ok: false, error: "Name is required." };
  try {
    const menu = await createMenu(name.trim());
    revalidatePath("/admin/menus");
    return { ok: true, id: menu.id };
  } catch {
    return { ok: false, error: "Failed to create menu." };
  }
}

export async function saveMenuAction(
  menuId: string,
  tree: MenuTreeNode[],
): Promise<MenuResult> {
  await requirePermission("menus.manage");
  try {
    await saveMenuTree(menuId, tree);
    invalidateThemeCache();
    revalidatePath(`/admin/menus/${menuId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save menu." };
  }
}
