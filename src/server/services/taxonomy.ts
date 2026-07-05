import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function listTaxonomies() {
  return db.taxonomy.findMany({ orderBy: { label: "asc" } });
}

export async function getTermsByTaxonomy(taxonomySlug: string) {
  const taxonomy = await db.taxonomy.findUnique({
    where: { slug: taxonomySlug },
    include: { terms: { orderBy: { name: "asc" } } },
  });
  return taxonomy?.terms ?? [];
}

/** Find or create a term by name within a taxonomy. */
export async function getOrCreateTerm(taxonomySlug: string, name: string) {
  const taxonomy = await db.taxonomy.findUnique({
    where: { slug: taxonomySlug },
  });
  if (!taxonomy) throw new Error(`Unknown taxonomy: ${taxonomySlug}`);
  const slug = slugify(name);
  return db.term.upsert({
    where: { taxonomyId_slug: { taxonomyId: taxonomy.id, slug } },
    update: {},
    create: { taxonomyId: taxonomy.id, name: name.trim(), slug },
  });
}

/**
 * Replace an entry's terms for a single taxonomy with the given names
 * (created on demand). Terms in other taxonomies are left untouched.
 */
export async function setEntryTerms(
  entryId: string,
  taxonomySlug: string,
  names: string[],
) {
  const taxonomy = await db.taxonomy.findUnique({
    where: { slug: taxonomySlug },
    select: { id: true },
  });
  if (!taxonomy) return;

  const clean = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
  const terms = await Promise.all(
    clean.map((name) => getOrCreateTerm(taxonomySlug, name)),
  );

  // Remove existing links for this taxonomy, then add the new set.
  await db.entryTerm.deleteMany({
    where: { entryId, term: { taxonomyId: taxonomy.id } },
  });
  if (terms.length > 0) {
    await db.entryTerm.createMany({
      data: terms.map((t) => ({ entryId, termId: t.id })),
      skipDuplicates: true,
    });
  }
}
