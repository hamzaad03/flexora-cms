import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "@/lib/env";

// Storage abstraction over the local persistent disk. Designed so an S3/CDN
// driver can be swapped in later without changing call sites.
//
// All paths are relative to STORAGE_DIR. Path traversal outside the root is
// rejected (defends against zip-slip and malicious relative paths).

const ROOT = path.resolve(process.cwd(), env.STORAGE_DIR);

export const StorageAreas = {
  themes: "themes",
  media: "media",
  tmp: "tmp",
} as const;

function resolveSafe(relativePath: string): string {
  const full = path.resolve(ROOT, relativePath);
  const rel = path.relative(ROOT, full);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`Unsafe storage path rejected: ${relativePath}`);
  }
  return full;
}

export const storage = {
  root: ROOT,

  resolve(relativePath: string): string {
    return resolveSafe(relativePath);
  },

  async ensureDir(relativePath: string): Promise<void> {
    await fs.mkdir(resolveSafe(relativePath), { recursive: true });
  },

  async writeFile(relativePath: string, data: Buffer | string): Promise<void> {
    const full = resolveSafe(relativePath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
  },

  async readFile(relativePath: string): Promise<Buffer> {
    return fs.readFile(resolveSafe(relativePath));
  },

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(resolveSafe(relativePath));
      return true;
    } catch {
      return false;
    }
  },

  async remove(relativePath: string): Promise<void> {
    await fs.rm(resolveSafe(relativePath), {
      recursive: true,
      force: true,
    });
  },

  async list(relativePath: string): Promise<string[]> {
    try {
      return await fs.readdir(resolveSafe(relativePath));
    } catch {
      return [];
    }
  },
};

export type Storage = typeof storage;
