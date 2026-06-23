import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { getContentTypeBySlug } from "@/server/services/content-type";
import { getEditorContext } from "@/server/services/editor-context";
import {
  EntryEditor,
  type EntryData,
} from "@/components/admin/content/entry-editor";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewEntryPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const user = await requirePermission("content.create");

  const contentType = await getContentTypeBySlug(type);
  if (!contentType) notFound();

  const { templates, taxonomies } = await getEditorContext(
    contentType.supports,
  );

  const empty: EntryData = {
    title: "",
    slug: "",
    status: "DRAFT",
    excerpt: "",
    contentHtml: "",
    templateId: null,
    publishedAt: null,
    terms: {},
    fields: {},
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/content/${type}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">
          New {contentType.labelSingular}
        </h1>
      </div>

      <EntryEditor
        typeSlug={type}
        typeLabel={contentType.labelSingular}
        fields={contentType.fields.map((f) => ({
          id: f.id,
          name: f.name,
          label: f.label,
          type: f.type,
          config: (f.config as Record<string, unknown>) ?? null,
        }))}
        templates={templates}
        taxonomies={taxonomies}
        entry={empty}
        canPublish={hasPermission(
          user.roles,
          user.permissions,
          "content.publish",
        )}
      />
    </div>
  );
}
