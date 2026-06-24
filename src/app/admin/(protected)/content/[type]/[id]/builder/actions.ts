"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/server/auth/guard";
import {
  BuilderAccessError,
  saveBuilderDocument,
} from "@/server/services/builder";
import {
  emptyBuilderDocument,
  builderDocumentSchema,
  starterBuilderDocument,
} from "@/lib/builder/document";
import { logger } from "@/lib/logger";

export type BuilderActionResult = {
  ok: boolean;
  error?: string;
};

function errorMessage(err: unknown) {
  if (err instanceof BuilderAccessError) return err.message;
  logger.error({ err }, "Builder action failed");
  return "Failed to save builder content.";
}

export async function saveBuilderDocumentAction(
  entryId: string,
  typeSlug: string,
  raw: unknown,
): Promise<BuilderActionResult> {
  const user = await requireUser();
  const parsed = builderDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid builder document.",
    };
  }
  try {
    await saveBuilderDocument(entryId, parsed.data, user);
    revalidatePath(`/admin/content/${typeSlug}/${entryId}/builder`);
    revalidatePath(`/admin/content/${typeSlug}/${entryId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function initializeBuilderDocumentAction(
  entryId: string,
  typeSlug: string,
): Promise<BuilderActionResult> {
  try {
    return await saveBuilderDocumentAction(
      entryId,
      typeSlug,
      emptyBuilderDocument(),
    );
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

export async function createStarterBuilderDocumentAction(
  entryId: string,
  typeSlug: string,
): Promise<BuilderActionResult> {
  try {
    return await saveBuilderDocumentAction(
      entryId,
      typeSlug,
      starterBuilderDocument(),
    );
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
