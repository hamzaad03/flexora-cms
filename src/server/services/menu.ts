import "server-only";

import { db } from "@/lib/db";

export type ResolvedMenuItem = {
  label: string;
  url: string;
  target: string;
  children: ResolvedMenuItem[];
};

/**
 * Resolve a menu by slug into a nested tree with concrete URLs.
 * Internal references (page/post/category) are resolved to their slugs.
 */
export async function resolveMenu(slug: string): Promise<ResolvedMenuItem[]> {
  const menu = await db.menu.findUnique({
    where: { slug },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!menu) return [];

  // Resolve internal entry references to URLs in one batch.
  const entryRefs = menu.items
    .filter((i) => (i.type === "page" || i.type === "post") && i.reference)
    .map((i) => i.reference as string);

  const entries = entryRefs.length
    ? await db.contentEntry.findMany({
        where: { id: { in: entryRefs } },
        select: { id: true, slug: true },
      })
    : [];
  const entryUrl = new Map(entries.map((e) => [e.id, `/${e.slug}`]));

  const urlFor = (item: (typeof menu.items)[number]): string => {
    switch (item.type) {
      case "page":
      case "post":
        return (item.reference && entryUrl.get(item.reference)) || "#";
      case "url":
      case "custom":
        return item.url || "#";
      default:
        return item.url || "#";
    }
  };

  // Build the tree from the flat list.
  const byParent = new Map<string | null, typeof menu.items>();
  for (const item of menu.items) {
    const key = item.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }

  const build = (parentId: string | null): ResolvedMenuItem[] =>
    (byParent.get(parentId) ?? []).map((item) => ({
      label: item.label,
      url: urlFor(item),
      target: item.target ?? "_self",
      children: build(item.id),
    }));

  return build(null);
}
