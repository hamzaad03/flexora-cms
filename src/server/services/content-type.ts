import "server-only";

import { db } from "@/lib/db";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { ContentTypeInput, FieldInput } from "@/lib/validations/content";

export async function listContentTypes() {
  return db.contentType.findMany({
    orderBy: { label: "asc" },
    include: { _count: { select: { entries: true, fields: true } } },
  });
}

export async function getContentTypeBySlug(slug: string) {
  return db.contentType.findUnique({
    where: { slug },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getContentTypeById(id: string) {
  return db.contentType.findUnique({
    where: { id },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createContentType(input: ContentTypeInput) {
  const slug = await uniqueSlug(
    input.slug || input.label,
    async (s) => (await db.contentType.count({ where: { slug: s } })) > 0,
  );
  return db.contentType.create({
    data: {
      slug,
      label: input.label,
      labelSingular: input.labelSingular,
      description: input.description ?? null,
      icon: input.icon ?? null,
      supports: (input.supports ?? {}) as object,
    },
  });
}

export async function updateContentType(id: string, input: ContentTypeInput) {
  return db.contentType.update({
    where: { id },
    data: {
      label: input.label,
      labelSingular: input.labelSingular,
      description: input.description ?? null,
      icon: input.icon ?? null,
      supports: (input.supports ?? {}) as object,
    },
  });
}

export async function deleteContentType(id: string) {
  const ct = await db.contentType.findUnique({ where: { id } });
  if (!ct) return;
  if (ct.isSystem) throw new Error("System content types cannot be deleted.");
  await db.contentType.delete({ where: { id } });
}

// ---- Custom fields ----

export async function addField(contentTypeId: string, input: FieldInput) {
  const count = await db.contentField.count({ where: { contentTypeId } });
  return db.contentField.create({
    data: {
      contentTypeId,
      name: slugify(input.name).replace(/-/g, "_"),
      label: input.label,
      type: input.type,
      config: (input.config ?? {}) as object,
      sortOrder: count,
    },
  });
}

export async function updateField(id: string, input: FieldInput) {
  return db.contentField.update({
    where: { id },
    data: {
      label: input.label,
      type: input.type,
      config: (input.config ?? {}) as object,
    },
  });
}

export async function deleteField(id: string) {
  await db.contentField.delete({ where: { id } });
}
