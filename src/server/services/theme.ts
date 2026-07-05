import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { extractThemeZip } from "@/server/theme/install";
import { parseManifest, type ThemeManifest } from "@/server/theme/manifest";
import { themeDir, themeFile } from "@/server/theme/paths";
import { invalidateThemeCache } from "@/server/theme/engine";

/** Upsert a theme + its templates from a parsed manifest. */
async function registerTheme(manifest: ThemeManifest) {
  const theme = await db.theme.upsert({
    where: { slug: manifest.slug },
    update: {
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      screenshot: manifest.screenshot,
      manifest: manifest as object,
    },
    create: {
      slug: manifest.slug,
      name: manifest.name,
      version: manifest.version,
      author: manifest.author,
      screenshot: manifest.screenshot,
      manifest: manifest as object,
    },
  });

  // Rebuild template rows to match the manifest.
  await db.template.deleteMany({ where: { themeId: theme.id } });
  const templates = Object.entries(manifest.templates);
  if (templates.length > 0) {
    await db.template.createMany({
      data: templates.map(([type, filePath]) => ({
        themeId: theme.id,
        name: type,
        type,
        filePath,
      })),
    });
  }

  invalidateThemeCache(manifest.slug);
  return theme;
}

/** Install a theme from an uploaded zip buffer. */
export async function installThemeFromZip(buffer: Buffer) {
  const { manifest } = await extractThemeZip(buffer);
  return registerTheme(manifest);
}

/** Recursively copy a source directory into the theme's storage dir. */
async function copyDirIntoStorage(absSrc: string, destRel: string) {
  const items = await fs.readdir(absSrc, { withFileTypes: true });
  for (const item of items) {
    const childAbs = path.join(absSrc, item.name);
    const childRel = `${destRel}/${item.name}`;
    if (item.isDirectory()) {
      await copyDirIntoStorage(childAbs, childRel);
    } else {
      await storage.writeFile(childRel, await fs.readFile(childAbs));
    }
  }
}

/** Install a bundled theme shipped in the repo at an absolute directory. */
export async function installThemeFromDir(absDir: string) {
  const manifest = parseManifest(
    JSON.parse(await fs.readFile(path.join(absDir, "theme.json"), "utf8")),
  );
  await storage.remove(themeDir(manifest.slug));
  await storage.ensureDir(themeDir(manifest.slug));
  await copyDirIntoStorage(absDir, themeDir(manifest.slug));
  logger.info({ slug: manifest.slug }, "Bundled theme installed");
  return registerTheme(manifest);
}

/**
 * Install the bundled starter theme (shipped in repo `themes/`) if no themes
 * exist yet, and activate it. Safe to call repeatedly.
 */
export async function ensureBundledThemes() {
  const count = await db.theme.count();
  if (count > 0) return;
  const dir = path.join(process.cwd(), "themes", "starter");
  await installThemeFromDir(dir);
  await activateTheme("starter");
}

export async function listThemes() {
  return db.theme.findMany({ orderBy: { name: "asc" } });
}

export async function getActiveTheme() {
  return db.theme.findFirst({ where: { isActive: true } });
}

/** Activate one theme and deactivate all others (atomic). */
export async function activateTheme(slug: string) {
  const theme = await db.theme.findUnique({ where: { slug } });
  if (!theme) throw new Error(`Theme not found: ${slug}`);

  // Ensure files still exist on disk.
  if (!(await storage.exists(themeFile(slug, "theme.json")))) {
    throw new Error(`Theme files missing for: ${slug}`);
  }

  await db.$transaction([
    db.theme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    db.theme.update({ where: { id: theme.id }, data: { isActive: true } }),
  ]);

  invalidateThemeCache();
  return theme;
}

export async function deleteTheme(slug: string) {
  const theme = await db.theme.findUnique({ where: { slug } });
  if (!theme) return;
  if (theme.isActive) throw new Error("Cannot delete the active theme.");
  await db.theme.delete({ where: { id: theme.id } });
  await storage.remove(themeDir(slug));
  invalidateThemeCache(slug);
}
