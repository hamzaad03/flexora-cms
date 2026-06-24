"use client";

import type { ReactNode } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers, Loader2, Monitor, Plus, ScanLine } from "lucide-react";

import { createStarterBuilderDocumentAction } from "@/app/admin/(protected)/content/[type]/[id]/builder/actions";
import type { BuilderDocument } from "@/lib/builder/document";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function BuilderCanvas({
  document,
  entryId,
  typeSlug,
}: {
  document: BuilderDocument;
  entryId: string;
  typeSlug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEmpty = document.sections.length === 0;

  const createStarter = () => {
    startTransition(async () => {
      const res = await createStarterBuilderDocumentAction(entryId, typeSlug);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to create starter section.");
        return;
      }
      toast.success("Starter section created.");
      router.refresh();
    });
  };

  return (
    <section
      className="overflow-hidden rounded-lg border bg-background"
      data-testid="builder-canvas"
    >
      <div className="flex h-12 items-center justify-between gap-3 border-b px-3">
        <div className="flex items-center gap-2">
          <ScanLine className="text-muted-foreground size-4" />
          <h2 className="text-sm font-medium">Visual canvas</h2>
          <Badge variant="outline">Read-only</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled>
            <Monitor className="size-4" />
            Desktop
          </Button>
          <Button variant="ghost" size="sm" disabled>
            100%
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100vh-18rem)] min-h-[34rem] overflow-auto bg-muted/30 p-4 md:p-6">
        <div
          className="mx-auto min-h-[40rem] w-full max-w-5xl bg-background shadow-sm ring-1 ring-border"
          data-testid="builder-desktop-frame"
        >
          {isEmpty ? (
            <div
              className="grid min-h-[40rem] place-items-center p-8 text-center"
              data-testid="builder-empty-state"
            >
              <div className="max-w-md space-y-4">
                <div className="mx-auto grid size-12 place-items-center rounded-lg bg-muted">
                  <Layers className="text-muted-foreground size-5" />
                </div>
                <div>
                  <p className="font-medium">Empty visual page</p>
                  <p className="text-muted-foreground text-sm">
                    Create a starter section to test the desktop canvas with a
                    section, container, and rich-text block.
                  </p>
                </div>
                <Button onClick={createStarter} disabled={pending}>
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  Create starter section
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 p-6" data-testid="builder-page-preview">
              {document.sections.map((section, index) => (
                <VisualNode
                  key={section.id}
                  kind="section"
                  id={section.id}
                  label={section.props.label || `Section ${index + 1}`}
                >
                  <div className="space-y-4">
                    {section.children.map((container) => (
                      <VisualNode
                        key={container.id}
                        kind="container"
                        id={container.id}
                        label={`${container.props.width} container`}
                      >
                        <div className="space-y-3">
                          {container.children.map((block) => (
                            <VisualNode
                              key={block.id}
                              kind="rich text"
                              id={block.id}
                              label="Rich text"
                            >
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: block.props.html,
                                }}
                              />
                            </VisualNode>
                          ))}
                        </div>
                      </VisualNode>
                    ))}
                  </div>
                </VisualNode>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VisualNode({
  kind,
  id,
  label,
  children,
}: {
  kind: string;
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      className="group relative rounded-md outline outline-2 -outline-offset-2 outline-transparent transition-colors hover:outline-ring focus-within:outline-ring"
      data-builder-node={id}
      data-builder-kind={kind}
      data-testid={`builder-node-${kind.replace(/\s+/g, "-")}`}
    >
      <div className="pointer-events-none absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-background/95 px-2 py-1 text-[11px] text-muted-foreground opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <span>{kind}</span>
        <span>·</span>
        <span>{id}</span>
      </div>
      <div className="rounded-md border border-dashed border-border/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant="outline">{kind}</Badge>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
