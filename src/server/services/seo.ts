import "server-only";

import { db } from "@/lib/db";
import { analyzeSeo } from "@/lib/seo-score";
import type { SeoInputData } from "@/lib/validations/content";

/** Upsert SEO meta for an entry and store the computed analysis scores. */
export async function saveSeo(
  entryId: string,
  seo: SeoInputData,
  entryTitle: string,
  contentHtml: string,
): Promise<void> {
  if (!seo) return;

  const analysis = analyzeSeo({
    title: entryTitle,
    metaTitle: seo.title,
    metaDescription: seo.description,
    focusKeyword: seo.focusKeyword,
    contentHtml,
  });

  let schema: object | null = null;
  if (seo.schema) {
    try {
      schema = JSON.parse(seo.schema);
    } catch {
      schema = null;
    }
  }

  await db.seoMeta.upsert({
    where: { entryId },
    update: {
      title: seo.title ?? null,
      description: seo.description ?? null,
      canonical: seo.canonical ?? null,
      robots: seo.robots ?? null,
      ogImage: seo.ogImage ?? null,
      focusKeyword: seo.focusKeyword ?? null,
      schema: schema as object,
      scores: analysis as object,
    },
    create: {
      entryId,
      title: seo.title ?? null,
      description: seo.description ?? null,
      canonical: seo.canonical ?? null,
      robots: seo.robots ?? null,
      ogImage: seo.ogImage ?? null,
      focusKeyword: seo.focusKeyword ?? null,
      schema: schema as object,
      scores: analysis as object,
    },
  });
}

export async function getSeo(entryId: string) {
  return db.seoMeta.findUnique({ where: { entryId } });
}
