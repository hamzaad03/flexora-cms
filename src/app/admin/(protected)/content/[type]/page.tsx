import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { getContentTypeBySlug } from "@/server/services/content-type";
import { listEntries } from "@/server/services/content";
import { Button } from "@/components/ui/button";
import {
  EntryList,
  type EntryRow,
} from "@/components/admin/content/entry-list";

export const dynamic = "force-dynamic";

export default async function ContentListPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const user = await requirePermission("content.view");

  const contentType = await getContentTypeBySlug(type);
  if (!contentType) notFound();

  const { items, total } = await listEntries(type);
  const rows: EntryRow[] = items.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    status: e.status,
    author: e.author?.name ?? e.author?.email ?? null,
    updatedAt: e.updatedAt.toISOString(),
  }));

  const canDelete = hasPermission(
    user.roles,
    user.permissions,
    "content.delete",
  );
  const canCreate = hasPermission(
    user.roles,
    user.permissions,
    "content.create",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{contentType.label}</h1>
          <p className="text-muted-foreground text-sm">{total} total</p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href={`/admin/content/${type}/new`}>
              <Plus className="size-4" />
              New {contentType.labelSingular}
            </Link>
          </Button>
        ) : null}
      </div>
      <EntryList typeSlug={type} rows={rows} canDelete={canDelete} />
    </div>
  );
}
