"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import { createRedirect, deleteRedirect } from "@/server/services/redirect";

export type RedirectResult = { ok: boolean; error?: string };

export async function createRedirectAction(
  from: string,
  to: string,
  code: number,
): Promise<RedirectResult> {
  await requirePermission("seo.manage");
  if (!from.trim() || !to.trim())
    return { ok: false, error: "From and To are required." };
  try {
    await createRedirect(from.trim(), to.trim(), code === 302 ? 302 : 301);
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to create redirect." };
  }
}

export async function deleteRedirectAction(
  id: string,
): Promise<RedirectResult> {
  await requirePermission("seo.manage");
  try {
    await deleteRedirect(id);
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete redirect." };
  }
}
