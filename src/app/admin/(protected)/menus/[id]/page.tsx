import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getMenuById, getMenuTree } from "@/server/services/menu";
import { listLinkableEntries } from "@/server/services/content";
import {
  MenuBuilder,
  type EntryOption,
} from "@/components/admin/menu/menu-builder";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MenuBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("menus.manage");

  const menu = await getMenuById(id);
  if (!menu) notFound();

  const [tree, entries] = await Promise.all([
    getMenuTree(id),
    listLinkableEntries(),
  ]);
  const entryOptions: EntryOption[] = entries;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/menus">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{menu.name}</h1>
      </div>

      <MenuBuilder menuId={menu.id} initialTree={tree} entries={entryOptions} />
    </div>
  );
}
