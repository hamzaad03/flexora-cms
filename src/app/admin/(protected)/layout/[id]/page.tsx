import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getArea } from "@/server/services/layout";
import { listContentTypes } from "@/server/services/content-type";
import {
  LayoutBuilder,
  type ContentTypeOption,
} from "@/components/admin/layout/layout-builder";
import type { AreaSettings, LayoutContent } from "@/lib/layout-types";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LayoutBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("layout.manage");

  const area = await getArea(id);
  if (!area) notFound();

  const contentTypes = await listContentTypes();
  const ctOptions: ContentTypeOption[] = contentTypes.map((c) => ({
    id: c.id,
    label: c.label,
  }));

  const assignedCtIds = area.assignments
    .filter((a) => a.contentTypeId)
    .map((a) => a.contentTypeId as string);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/layout">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          {area.name}{" "}
          <span className="text-muted-foreground text-sm font-normal">
            ({area.type.toLowerCase()})
          </span>
        </h1>
      </div>

      <LayoutBuilder
        areaId={area.id}
        initialName={area.name}
        initialStatus={area.status}
        initialContent={(area.content as LayoutContent) ?? { rows: [] }}
        initialSettings={(area.settings as AreaSettings) ?? {}}
        initialIsDefault={area.isDefault}
        initialContentTypeIds={assignedCtIds}
        contentTypes={ctOptions}
      />
    </div>
  );
}
