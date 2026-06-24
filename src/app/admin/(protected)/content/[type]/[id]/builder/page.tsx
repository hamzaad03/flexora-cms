import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";

import { BUILDER_ENABLED } from "@/lib/builder/config";
import type { BuilderDocument } from "@/lib/builder/document";
import { sanitizeRichText } from "@/lib/sanitize";
import { getCurrentUser } from "@/server/auth/guard";
import {
  BuilderAccessError,
  getBuilderEntryForEditor,
} from "@/server/services/builder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InitializeBuilderButton } from "@/components/admin/builder/initialize-builder-button";
import { BuilderCanvas } from "@/components/admin/builder/builder-canvas";

export const metadata = { title: "Visual Builder" };
export const dynamic = "force-dynamic";

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  if (!BUILDER_ENABLED) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <Lock className="text-muted-foreground size-8" />
        <div>
          <h1 className="text-xl font-semibold">Visual builder disabled</h1>
          <p className="text-muted-foreground text-sm">
            Set `FLX_BUILDER_ENABLED=true` to enable this test slice.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) notFound();

  let loaded: Awaited<ReturnType<typeof getBuilderEntryForEditor>> | null;
  try {
    loaded = await getBuilderEntryForEditor(id, user);
  } catch (err) {
    if (err instanceof BuilderAccessError) redirect("/admin/forbidden");
    throw err;
  }

  if (!loaded || loaded.entry.contentType.slug !== type) notFound();

  const hasStoredDocument = loaded.entry.contentJson != null;
  const document = sanitizeDocumentForPreview(loaded.document);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href={`/admin/content/${type}/${id}`}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">
              Visual builder: {loaded.entry.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              Foundation slice: schema-backed, read-only builder preview.
            </p>
          </div>
        </div>
        <Badge variant={hasStoredDocument ? "secondary" : "outline"}>
          {hasStoredDocument ? "builder JSON saved" : "no builder JSON"}
        </Badge>
      </div>

      <div
        className="grid gap-3 rounded-lg border bg-background p-3 text-sm sm:grid-cols-3"
        data-testid="builder-entry-metadata"
      >
        <div>
          <span className="text-muted-foreground block text-xs">Status</span>
          <span className="font-medium">{loaded.entry.status}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Slug</span>
          <span className="font-medium">{loaded.entry.slug}</span>
        </div>
        <div>
          <span className="text-muted-foreground block text-xs">Type</span>
          <span className="font-medium">
            {loaded.entry.contentType.labelSingular}
          </span>
        </div>
      </div>

      {!hasStoredDocument ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="max-w-2xl space-y-3">
            <h2 className="font-medium">
              Start with an empty builder document
            </h2>
            <p className="text-muted-foreground text-sm">
              This creates the first visual-builder document for the page. It
              only writes `contentJson`; title, slug, SEO, status, taxonomies,
              and template assignment stay untouched.
            </p>
            <InitializeBuilderButton entryId={id} typeSlug={type} />
          </div>
        </div>
      ) : null}

      <BuilderCanvas document={document} entryId={id} typeSlug={type} />
    </div>
  );
}

function sanitizeDocumentForPreview(
  document: BuilderDocument,
): BuilderDocument {
  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      children: section.children.map((container) => ({
        ...container,
        children: container.children.map((block) => ({
          ...block,
          props: { ...block.props, html: sanitizeRichText(block.props.html) },
        })),
      })),
    })),
  };
}
