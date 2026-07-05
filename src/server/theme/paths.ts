import { StorageAreas, storage } from "@/lib/storage";

// Storage-relative directory for a theme's extracted files.
export function themeDir(slug: string): string {
  return `${StorageAreas.themes}/${slug}`;
}

// Storage-relative path to a file inside a theme.
export function themeFile(slug: string, relativePath: string): string {
  return `${themeDir(slug)}/${relativePath}`;
}

// Absolute filesystem path to a theme's directory (for the Liquid engine root).
export function themeAbsoluteDir(slug: string): string {
  return storage.resolve(themeDir(slug));
}
