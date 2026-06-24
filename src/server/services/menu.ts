import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";

export type ResolvedMenuItem = {
  label: string;
  url: string;
  target: string;
  config: Record<string, unknown> | null;
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
      config: (item.config as Record<string, unknown> | null) ?? null,
      children: build(item.id),
    }));

  return build(null);
}

// ---- Admin: menu + item management ----

export type MenuTreeNode = {
  label: string;
  type: string; // page | post | category | url | custom
  url: string | null;
  reference: string | null;
  target: string;
  config: Record<string, unknown> | null;
  children: MenuTreeNode[];
};

export async function listMenus() {
  return db.menu.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function createMenu(name: string) {
  const slug = slugify(name) || "menu";
  return db.menu.upsert({
    where: { slug },
    update: {},
    create: { slug, name },
  });
}

/** Editable tree (raw fields) for the menu builder. */
export async function getMenuTree(menuId: string): Promise<MenuTreeNode[]> {
  const items = await db.menuItem.findMany({
    where: { menuId },
    orderBy: { sortOrder: "asc" },
  });
  const byParent = new Map<string | null, typeof items>();
  for (const item of items) {
    const key = item.parentId ?? null;
    const list = byParent.get(key) ?? [];
    list.push(item);
    byParent.set(key, list);
  }
  const build = (parentId: string | null): MenuTreeNode[] =>
    (byParent.get(parentId) ?? []).map((i) => ({
      label: i.label,
      type: i.type,
      url: i.url,
      reference: i.reference,
      target: i.target ?? "_self",
      config: (i.config as Record<string, unknown> | null) ?? null,
      children: build(i.id),
    }));
  return build(null);
}

/** Replace a menu's items with the given tree (flattened, recreated). */
export async function saveMenuTree(menuId: string, tree: MenuTreeNode[]) {
  await db.menuItem.deleteMany({ where: { menuId } });

  const createLevel = async (
    nodes: MenuTreeNode[],
    parentId: string | null,
  ) => {
    let order = 0;
    for (const node of nodes) {
      const created = await db.menuItem.create({
        data: {
          menuId,
          parentId,
          label: node.label,
          type: node.type,
          url: node.url,
          reference: node.reference,
          target: node.target,
          config: (node.config ?? undefined) as object | undefined,
          sortOrder: order++,
        },
      });
      if (node.children?.length) await createLevel(node.children, created.id);
    }
  };

  await createLevel(tree, null);
}

export async function getMenuById(id: string) {
  return db.menu.findUnique({ where: { id } });
}
