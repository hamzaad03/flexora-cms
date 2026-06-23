"use server";

import { revalidatePath } from "next/cache";
import path from "node:path";

import { requirePermission } from "@/server/auth/guard";
import {
  activateTheme,
  deleteTheme,
  installThemeFromDir,
  installThemeFromZip,
} from "@/server/services/theme";
import { logger } from "@/lib/logger";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;

export type ThemeActionState = { error?: string; success?: string };

export async function activateThemeAction(
  _prev: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  await requirePermission("themes.manage");
  const slug = String(formData.get("slug") ?? "");
  try {
    await activateTheme(slug);
    revalidatePath("/admin/themes");
    return { success: `Activated "${slug}".` };
  } catch (err) {
    logger.error({ err, slug }, "Activate theme failed");
    return { error: err instanceof Error ? err.message : "Activation failed." };
  }
}

export async function deleteThemeAction(
  _prev: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  await requirePermission("themes.manage");
  const slug = String(formData.get("slug") ?? "");
  try {
    await deleteTheme(slug);
    revalidatePath("/admin/themes");
    return { success: `Deleted "${slug}".` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Delete failed." };
  }
}

export async function installStarterAction(): Promise<ThemeActionState> {
  await requirePermission("themes.manage");
  try {
    await installThemeFromDir(path.join(process.cwd(), "themes", "starter"));
    revalidatePath("/admin/themes");
    return { success: "Starter theme installed." };
  } catch (err) {
    logger.error({ err }, "Install starter failed");
    return { error: "Failed to install the starter theme." };
  }
}

export async function uploadThemeAction(
  _prev: ThemeActionState,
  formData: FormData,
): Promise<ThemeActionState> {
  await requirePermission("themes.manage");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a .zip theme file." };
  }
  if (!file.name.toLowerCase().endsWith(".zip")) {
    return { error: "Theme must be a .zip file." };
  }
  if (file.size > MAX_ZIP_BYTES) {
    return { error: "Theme zip exceeds 50MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const theme = await installThemeFromZip(buffer);
    revalidatePath("/admin/themes");
    return { success: `Installed "${theme.name}".` };
  } catch (err) {
    logger.error({ err }, "Theme upload failed");
    return {
      error: err instanceof Error ? err.message : "Theme install failed.",
    };
  }
}
