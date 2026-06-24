import "server-only";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { logger } from "@/lib/logger";

const MAX_IMAGE_DIMENSION = 2400;

/** Public URL for a stored media file. */
export function mediaUrl(relPath: string): string {
  return `/media/${relPath}`;
}

export async function listFolders() {
  return db.mediaFolder.findMany({ orderBy: { name: "asc" } });
}

export async function createFolder(name: string, parentId?: string | null) {
  return db.mediaFolder.create({
    data: { name, parentId: parentId ?? null },
  });
}

export async function listMedia(folderId?: string | null) {
  return db.media.findMany({
    where: folderId !== undefined ? { folderId } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export type UploadInput = {
  buffer: Buffer;
  filename: string;
  mime: string;
  folderId?: string | null;
  uploaderId?: string | null;
};

/** Store an uploaded file; optimize + measure images via sharp. */
export async function uploadMedia(input: UploadInput) {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  let ext = path.extname(input.filename).replace(".", "").toLowerCase();

  let buffer = input.buffer;
  let width: number | null = null;
  let height: number | null = null;

  if (input.mime.startsWith("image/") && input.mime !== "image/svg+xml") {
    try {
      const img = sharp(input.buffer, { failOn: "none" }).rotate();
      const meta = await img.metadata();
      // Downscale very large images; re-encode to strip metadata + compress.
      if ((meta.width ?? 0) > MAX_IMAGE_DIMENSION) {
        img.resize({ width: MAX_IMAGE_DIMENSION });
      }
      buffer = await img
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer({ resolveWithObject: false })
        .catch(() => input.buffer);
      const out = await sharp(buffer).metadata();
      width = out.width ?? null;
      height = out.height ?? null;
      ext = "jpg";
    } catch (err) {
      logger.warn({ err }, "sharp processing failed; storing original");
    }
  }

  const relPath = `${yyyy}/${mm}/${randomUUID()}.${ext || "bin"}`;
  await storage.writeFile(`media/${relPath}`, buffer);

  return db.media.create({
    data: {
      path: relPath,
      mime: ext === "jpg" ? "image/jpeg" : input.mime,
      size: buffer.length,
      width,
      height,
      folderId: input.folderId ?? null,
      uploaderId: input.uploaderId ?? null,
    },
  });
}

export async function updateMedia(
  id: string,
  data: { alt?: string | null; caption?: string | null },
) {
  return db.media.update({ where: { id }, data });
}

export async function deleteMedia(id: string) {
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return;
  await storage.remove(`media/${media.path}`);
  await db.media.delete({ where: { id } });
}
