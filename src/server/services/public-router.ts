import "server-only";

import { db } from "@/lib/db";

type PublishedEntry = NonNullable<Awaited<ReturnType<typeof findPublished>>>;

export type ResolvedRoute = {
  entry: PublishedEntry;
  typeSlug: string;
  templateType: string;
};

async function findPublished(slug: string) {
  // Live = explicitly published, OR scheduled with a due publish time.
  return db.contentEntry.findFirst({
    where: {
      slug,
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", publishedAt: { lte: new Date() } },
      ],
    },
    include: { contentType: true, template: true },
  });
}

/**
 * Map a URL path (array of segments) to a content entry + template type.
 * Returns null if nothing matches (caller renders 404).
 */
export async function resolveRoute(
  segments: string[],
): Promise<ResolvedRoute | null> {
  const slug = segments.join("/");

  // Home: the page with slug "home" (front page).
  if (slug === "") {
    const entry = await findPublished("home");
    if (!entry) return null;
    return { entry, typeSlug: entry.contentType.slug, templateType: "home" };
  }

  const entry = await findPublished(slug);
  if (!entry) return null;

  // Template precedence: explicit assignment > content-type default.
  const templateType =
    entry.template?.type ??
    (entry.contentType.slug === "post" ? "post" : "page");

  return { entry, typeSlug: entry.contentType.slug, templateType };
}

/** Published (or scheduled-and-due) entries of a type, newest first. */
export async function listPublishedEntries(typeSlug: string, take = 50) {
  return db.contentEntry.findMany({
    where: {
      contentType: { slug: typeSlug },
      OR: [
        { status: "PUBLISHED" },
        { status: "SCHEDULED", publishedAt: { lte: new Date() } },
      ],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
  });
}
