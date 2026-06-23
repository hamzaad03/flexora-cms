import "server-only";
import type { EntryStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";
import { sanitizeRichText } from "@/lib/sanitize";
import type { EntryInput } from "@/lib/validations/content";
import { setEntryTerms } from "./taxonomy";

export type ListEntriesOptions = {
  status?: EntryStatus;
  q?: string;
  take?: number;
  skip?: number;
};

export async function listEntries(
  typeSlug: string,
  opts: ListEntriesOptions = {},
) {
  const where: Prisma.ContentEntryWhereInput = {
    contentType: { slug: typeSlug },
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q ? { title: { contains: opts.q } } : {}),
  };
  const [items, total] = await Promise.all([
    db.contentEntry.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { author: { select: { name: true, email: true } } },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    }),
    db.contentEntry.count({ where }),
  ]);
  return { items, total };
}

export async function getEntry(id: string) {
  return db.contentEntry.findUnique({
    where: { id },
    include: {
      contentType: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
      template: true,
      author: { select: { id: true, name: true, email: true } },
      terms: { include: { term: { include: { taxonomy: true } } } },
      fieldValues: true,
    },
  });
}

function computePublishedAt(
  status: EntryStatus,
  publishedAtInput: string | null | undefined,
  existing: Date | null,
): Date | null {
  if (status === "PUBLISHED") {
    if (publishedAtInput) {
      const d = new Date(publishedAtInput);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return existing ?? new Date();
  }
  if (status === "SCHEDULED") {
    const d = publishedAtInput ? new Date(publishedAtInput) : null;
    return d && !Number.isNaN(d.getTime()) ? d : new Date();
  }
  return null; // DRAFT / TRASHED
}

async function saveFieldValues(
  entryId: string,
  contentTypeId: string,
  fields: Record<string, unknown> | undefined,
) {
  if (!fields) return;
  const defs = await db.contentField.findMany({ where: { contentTypeId } });
  for (const def of defs) {
    if (!(def.name in fields)) continue;
    const value = fields[def.name];
    await db.contentFieldValue.upsert({
      where: { entryId_fieldId: { entryId, fieldId: def.id } },
      update: { value: value as object },
      create: { entryId, fieldId: def.id, value: value as object },
    });
  }
}

async function applyTerms(
  entryId: string,
  terms: Record<string, string[]> | undefined,
) {
  if (!terms) return;
  for (const [taxonomySlug, names] of Object.entries(terms)) {
    await setEntryTerms(entryId, taxonomySlug, names);
  }
}

/** Snapshot the current entry (incl. field values + terms) for revisions. */
async function snapshotEntry(entryId: string): Promise<Prisma.JsonObject> {
  const entry = await db.contentEntry.findUnique({
    where: { id: entryId },
    include: {
      fieldValues: { include: { field: true } },
      terms: { include: { term: { include: { taxonomy: true } } } },
    },
  });
  if (!entry) return {};

  const fields: Record<string, unknown> = {};
  for (const fv of entry.fieldValues) fields[fv.field.name] = fv.value;

  const terms: Record<string, string[]> = {};
  for (const et of entry.terms) {
    const tax = et.term.taxonomy.slug;
    (terms[tax] ??= []).push(et.term.name);
  }

  return {
    title: entry.title,
    slug: entry.slug,
    status: entry.status,
    excerpt: entry.excerpt,
    contentHtml: entry.contentHtml,
    templateId: entry.templateId,
    featuredMedia: entry.featuredMedia,
    publishedAt: entry.publishedAt?.toISOString() ?? null,
    fields,
    terms,
  } as Prisma.JsonObject;
}

export async function createEntry(
  typeSlug: string,
  input: EntryInput,
  authorId: string | null,
) {
  const contentType = await db.contentType.findUnique({
    where: { slug: typeSlug },
  });
  if (!contentType) throw new Error(`Unknown content type: ${typeSlug}`);

  const slug = await uniqueSlug(
    input.slug || input.title,
    async (s) =>
      (await db.contentEntry.count({
        where: { contentTypeId: contentType.id, slug: s },
      })) > 0,
  );

  const entry = await db.contentEntry.create({
    data: {
      contentTypeId: contentType.id,
      title: input.title,
      slug,
      status: input.status,
      excerpt: input.excerpt ?? null,
      contentHtml: sanitizeRichText(input.contentHtml ?? ""),
      templateId: input.templateId || null,
      parentId: input.parentId || null,
      featuredMedia: input.featuredMedia || null,
      authorId,
      publishedAt: computePublishedAt(input.status, input.publishedAt, null),
    },
  });

  await saveFieldValues(entry.id, contentType.id, input.fields);
  await applyTerms(entry.id, input.terms);

  await db.revision.create({
    data: {
      entryId: entry.id,
      authorId,
      snapshot: await snapshotEntry(entry.id),
    },
  });

  return entry;
}

export async function updateEntry(
  id: string,
  input: EntryInput,
  editorId: string | null,
) {
  const existing = await db.contentEntry.findUnique({ where: { id } });
  if (!existing) throw new Error("Entry not found.");

  // Snapshot the pre-edit state.
  await db.revision.create({
    data: {
      entryId: id,
      authorId: editorId,
      snapshot: await snapshotEntry(id),
    },
  });

  // Slug: only change when explicitly provided (preserves existing URLs).
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await uniqueSlug(
      input.slug,
      async (s) =>
        (await db.contentEntry.count({
          where: {
            contentTypeId: existing.contentTypeId,
            slug: s,
            id: { not: id },
          },
        })) > 0,
    );
  }

  const entry = await db.contentEntry.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      status: input.status,
      excerpt: input.excerpt ?? null,
      contentHtml: sanitizeRichText(input.contentHtml ?? ""),
      templateId: input.templateId || null,
      parentId: input.parentId || null,
      featuredMedia: input.featuredMedia || null,
      publishedAt: computePublishedAt(
        input.status,
        input.publishedAt,
        existing.publishedAt,
      ),
    },
  });

  await saveFieldValues(entry.id, existing.contentTypeId, input.fields);
  await applyTerms(entry.id, input.terms);

  return entry;
}

export async function deleteEntry(id: string) {
  await db.contentEntry.delete({ where: { id } });
}

export async function listRevisions(entryId: string) {
  return db.revision.findMany({
    where: { entryId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
    take: 30,
  });
}

/** Restore an entry to a previous revision (itself recorded as a revision). */
export async function restoreRevision(
  revisionId: string,
  editorId: string | null,
) {
  const revision = await db.revision.findUnique({ where: { id: revisionId } });
  if (!revision) throw new Error("Revision not found.");
  const snap = revision.snapshot as Prisma.JsonObject;

  // Snapshot current state first.
  await db.revision.create({
    data: {
      entryId: revision.entryId,
      authorId: editorId,
      snapshot: await snapshotEntry(revision.entryId),
    },
  });

  const status = (snap.status as EntryStatus) ?? "DRAFT";
  await db.contentEntry.update({
    where: { id: revision.entryId },
    data: {
      title: (snap.title as string) ?? "Untitled",
      excerpt: (snap.excerpt as string) ?? null,
      contentHtml: (snap.contentHtml as string) ?? "",
      templateId: (snap.templateId as string) ?? null,
      featuredMedia: (snap.featuredMedia as string) ?? null,
      status,
      publishedAt: snap.publishedAt
        ? new Date(snap.publishedAt as string)
        : null,
    },
  });

  const contentTypeId = (
    await db.contentEntry.findUnique({
      where: { id: revision.entryId },
      select: { contentTypeId: true },
    })
  )?.contentTypeId;
  if (contentTypeId) {
    await saveFieldValues(
      revision.entryId,
      contentTypeId,
      (snap.fields as Record<string, unknown>) ?? undefined,
    );
  }
  await applyTerms(
    revision.entryId,
    (snap.terms as Record<string, string[]>) ?? undefined,
  );
}
