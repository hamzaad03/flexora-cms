import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getContentTypeById } from "@/server/services/content-type";
import { ContentTypeForm, type ContentTypeData } from "../content-type-form";
import { FieldsManager, type FieldRow } from "../fields-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EditContentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("content_types.manage");

  const ct = await getContentTypeById(id);
  if (!ct) notFound();

  const supports = (ct.supports as Record<string, unknown> | null) ?? {};
  const data: ContentTypeData = {
    id: ct.id,
    slug: ct.slug,
    label: ct.label,
    labelSingular: ct.labelSingular,
    description: ct.description ?? "",
    icon: ct.icon ?? "",
    supports: {
      seo: Boolean(supports.seo ?? true),
      revisions: Boolean(supports.revisions ?? true),
      author: Boolean(supports.author ?? true),
      hierarchical: Boolean(supports.hierarchical ?? false),
      taxonomies: (supports.taxonomies as string[] | undefined) ?? [],
    },
  };

  const fields: FieldRow[] = ct.fields.map((f) => ({
    id: f.id,
    name: f.name,
    label: f.label,
    type: f.type,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/content-types">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{ct.label}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentTypeForm data={data} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom fields</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldsManager contentTypeId={ct.id} fields={fields} />
        </CardContent>
      </Card>
    </div>
  );
}
