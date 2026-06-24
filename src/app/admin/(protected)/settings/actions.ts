"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/server/auth/guard";
import { setSetting } from "@/server/services/settings";
import { invalidateThemeCache } from "@/server/theme/engine";

const ALLOWED_KEYS = new Set([
  "identity.title",
  "identity.tagline",
  "identity.logo",
  "identity.favicon",
  "integrations.ga",
  "integrations.gsc",
  "integrations.clarity",
  "analytics.enabled",
  "forms.turnstile.site",
  "forms.turnstile.secret",
]);

export type SettingsResult = { ok: boolean; error?: string };

export async function saveSettingsAction(
  values: Record<string, unknown>,
): Promise<SettingsResult> {
  await requirePermission("settings.manage");
  try {
    for (const [key, value] of Object.entries(values)) {
      if (ALLOWED_KEYS.has(key)) await setSetting(key, value);
    }
    invalidateThemeCache();
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save settings." };
  }
}
