import "server-only";

import { db } from "@/lib/db";

/** Templates (from the active theme) + taxonomies a content type supports. */
export async function getEditorContext(supports: unknown) {
  const activeTheme = await db.theme.findFirst({
    where: { isActive: true },
    include: { templates: { orderBy: { name: "asc" } } },
  });
  const templates = (activeTheme?.templates ?? []).map((t) => ({
    id: t.id,
    label: `${t.name} (${t.type})`,
  }));

  const taxSlugs =
    ((supports as { taxonomies?: string[] } | null)?.taxonomies as
      | string[]
      | undefined) ?? [];
  const taxRows = taxSlugs.length
    ? await db.taxonomy.findMany({ where: { slug: { in: taxSlugs } } })
    : [];
  const taxonomies = taxRows.map((t) => ({ slug: t.slug, label: t.label }));

  return { templates, taxonomies };
}
