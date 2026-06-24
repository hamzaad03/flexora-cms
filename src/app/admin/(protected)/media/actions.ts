"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser, requirePermission } from "@/server/auth/guard";
import {
  uploadMedia,
  updateMedia,
  deleteMedia,
  createFolder,
} from "@/server/services/media";
import { logger } from "@/lib/logger";

export type MediaResult = { ok: boolean; error?: string; count?: number };

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export async function uploadMediaAction(
  formData: FormData,
): Promise<MediaResult> {
  const user = await requirePermission("media.upload");
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File);
  const folderId = (formData.get("folderId") as string) || null;

  if (files.length === 0) return { ok: false, error: "No files selected." };

  let count = 0;
  for (const file of files) {
    if (file.size === 0 || file.size > MAX_FILE_BYTES) continue;
    try {
      await uploadMedia({
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: file.name,
        mime: file.type || "application/octet-stream",
        folderId,
        uploaderId: user.id,
      });
      count += 1;
    } catch (err) {
      logger.error({ err, name: file.name }, "Media upload failed");
    }
  }

  revalidatePath("/admin/media");
  return count > 0
    ? { ok: true, count }
    : { ok: false, error: "Upload failed." };
}

export async function updateMediaAction(
  id: string,
  data: { alt: string; caption: string },
): Promise<MediaResult> {
  await requirePermission("media.upload");
  try {
    await updateMedia(id, {
      alt: data.alt || null,
      caption: data.caption || null,
    });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save." };
  }
}

export async function deleteMediaAction(id: string): Promise<MediaResult> {
  await requirePermission("media.delete");
  try {
    await deleteMedia(id);
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete." };
  }
}

export async function createFolderAction(name: string): Promise<MediaResult> {
  await getCurrentUser();
  await requirePermission("media.upload");
  if (!name.trim()) return { ok: false, error: "Name required." };
  try {
    await createFolder(name.trim());
    revalidatePath("/admin/media");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to create folder." };
  }
}
