"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import { setCustomizer, CSS_VAR_MAP } from "@/server/services/customizer";
import { invalidateThemeCache } from "@/server/theme/engine";

export type CustomizerState = { error?: string; success?: string };

export async function saveCustomizerAction(
  _prev: CustomizerState,
  formData: FormData,
): Promise<CustomizerState> {
  await requirePermission("customizer.manage");

  // Only persist known customizer keys.
  const values: Record<string, unknown> = {};
  for (const key of Object.keys(CSS_VAR_MAP)) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }

  try {
    await setCustomizer(values);
    invalidateThemeCache();
    revalidatePath("/admin/customizer");
    return { success: "Customizer saved." };
  } catch {
    return { error: "Failed to save customizer." };
  }
}
