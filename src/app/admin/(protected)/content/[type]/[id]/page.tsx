import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { getEntry, listRevisions } from "@/server/services/content";
import { getEditorContext } from "@/server/services/editor-context";
import {
  EntryEditor,
  type EntryData,
} from "@/components/admin/content/entry-editor";
import {
  RevisionsPanel,
  type RevisionRow,
} from "@/components/admin/content/revisions-panel";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const entry = await getEntry(id);
  if (!entry || entry.contentType.slug !== type) notFound();

  const { templates, taxonomies } = await getEditorContext(
    entry.contentType.supports,
  );

  // Build terms map: taxonomy slug -> term names.
  const termsMap: Record<string, string[]> = {};
  for (const et of entry.terms) {
    (termsMap[et.term.taxonomy.slug] ??= []).push(et.term.name);
  }
  // Build custom field values: field name -> value.
  const fieldMap: Record<string, unknown> = {};
  const fieldById = new Map(entry.contentType.fields.map((f) => [f.id, f]));
  for (const fv of entry.fieldValues) {
    const def = fieldById.get(fv.fieldId);
    if (def) fieldMap[def.name] = fv.value;
  }

  const data: EntryData = {
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    status: entry.status,
    excerpt: entry.excerpt ?? "",
    contentHtml: entry.contentHtml ?? "",
    templateId: entry.templateId,
    publishedAt: entry.publishedAt?.toISOString() ?? null,
    terms: termsMap,
    fields: fieldMap,
    seo: {
      title: entry.seo?.title ?? "",
      description: entry.seo?.description ?? "",
      canonical: entry.seo?.canonical ?? "",
      robots: entry.seo?.robots ?? "",
      ogImage: entry.seo?.ogImage ?? "",
      focusKeyword: entry.seo?.focusKeyword ?? "",
      schema: entry.seo?.schema ? JSON.stringify(entry.seo.schema) : "",
    },
  };

  const revisions: RevisionRow[] = (await listRevisions(id)).map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    author: r.author?.name ?? r.author?.email ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/content/${type}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="truncate text-2xl font-semibold">{entry.title}</h1>
      </div>

      <EntryEditor
        typeSlug={type}
        typeLabel={entry.contentType.labelSingular}
        fields={entry.contentType.fields.map((f) => ({
          id: f.id,
          name: f.name,
          label: f.label,
          type: f.type,
          config: (f.config as Record<string, unknown>) ?? null,
        }))}
        templates={templates}
        taxonomies={taxonomies}
        entry={data}
        canPublish={hasPermission(
          user.roles,
          user.permissions,
          "content.publish",
        )}
      />

      <RevisionsPanel typeSlug={type} entryId={id} revisions={revisions} />
    </div>
  );
}
