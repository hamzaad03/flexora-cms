import "server-only";
import AdmZip from "adm-zip";
import path from "node:path";

import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { parseManifest, type ThemeManifest } from "./manifest";
import { themeDir, themeFile } from "./paths";

const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50MB total
const BLOCKED_EXT = new Set([".php", ".exe", ".sh", ".bat", ".cmd"]);

export type InstalledTheme = {
  manifest: ThemeManifest;
  files: number;
};

/**
 * Extract a theme zip into storage/themes/<slug>/ with zip-slip protection,
 * a total-size cap, and an executable-file blocklist. Returns the parsed
 * manifest. Does NOT touch the database (see services/theme.ts).
 */
export async function extractThemeZip(buffer: Buffer): Promise<InstalledTheme> {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  // Locate the shallowest theme.json to support zips with a top-level folder.
  const manifestEntry = entries
    .filter((e) => !e.isDirectory && /(^|\/)theme\.json$/.test(e.entryName))
    .sort((a, b) => a.entryName.length - b.entryName.length)[0];

  if (!manifestEntry) {
    throw new Error("theme.json not found in the uploaded zip.");
  }

  const prefix = manifestEntry.entryName.replace(/theme\.json$/, "");

  let manifest: ThemeManifest;
  try {
    manifest = parseManifest(
      JSON.parse(manifestEntry.getData().toString("utf8")),
    );
  } catch (err) {
    throw new Error(
      `Invalid theme.json: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  const slug = manifest.slug;
  const destRoot = themeDir(slug);

  // Fresh install: clear any previous copy.
  await storage.remove(destRoot);
  await storage.ensureDir(destRoot);

  let total = 0;
  let count = 0;

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!entry.entryName.startsWith(prefix)) continue;

    const relative = entry.entryName.slice(prefix.length);
    if (!relative) continue;

    const ext = path.extname(relative).toLowerCase();
    if (BLOCKED_EXT.has(ext)) {
      logger.warn({ slug, relative }, "Skipped blocked theme file");
      continue;
    }

    const data = entry.getData();
    total += data.length;
    if (total > MAX_UNCOMPRESSED_BYTES) {
      await storage.remove(destRoot);
      throw new Error("Theme exceeds the maximum uncompressed size (50MB).");
    }

    // storage.writeFile resolves through the safe resolver (rejects zip-slip).
    await storage.writeFile(themeFile(slug, relative), data);
    count += 1;
  }

  logger.info({ slug, files: count }, "Theme extracted");
  return { manifest, files: count };
}
