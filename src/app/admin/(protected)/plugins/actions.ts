"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import { setPluginEnabled } from "@/server/services/plugins";

export type PluginResult = { ok: boolean; error?: string };

export async function togglePluginAction(
  slug: string,
  enabled: boolean,
): Promise<PluginResult> {
  await requirePermission("plugins.manage");
  try {
    await setPluginEnabled(slug, enabled);
    revalidatePath("/admin/plugins");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update plugin." };
  }
}
