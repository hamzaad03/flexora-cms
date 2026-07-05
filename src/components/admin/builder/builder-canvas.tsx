"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Layers,
  Loader2,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  ScanLine,
} from "lucide-react";

import {
  createStarterBuilderDocumentAction,
  saveBuilderDocumentAction,
} from "@/app/admin/(protected)/content/[type]/[id]/builder/actions";
import {
  emptyBuilderDocument,
  type BuilderDocument,
  type BuilderNode,
  type StyleMap,
} from "@/lib/builder/document";
import { compileDocumentCss, nodeClassName } from "@/lib/builder/styles";
import {
  BUILDER_PAGE_NODE_ID,
  buildSelectionTree,
  getBreadcrumb,
  getFirstChildNodeId,
  getNextSiblingNodeId,
  getParentNodeId,
  getPreviousSiblingNodeId,
  resolveSelectedNodeId,
  type BuilderSelectableNode,
} from "@/lib/builder/selection";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function friendlyKind(type: BuilderNode["type"]): string {
  return type === "richText" ? "rich text" : type;
}

export function BuilderCanvas({
  document,
  entryId,
  typeSlug,
  persisted,
}: {
  document: BuilderDocument;
  entryId: string;
  typeSlug: string;
  persisted: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [draftDocument, setDraftDocument] = useState(document);
  const [savedDocument, setSavedDocument] = useState(
    persisted ? document : emptyBuilderDocument(),
  );
  const selectionTree = useMemo(
    () => buildSelectionTree(draftDocument),
    [draftDocument],
  );
  const compiledCss = useMemo(
    () => compileDocumentCss(draftDocument),
    [draftDocument],
  );
  const [selectedId, setSelectedId] = useState(() =>
    resolveSelectedNodeId(selectionTree, searchParams.get("selected")),
  );
  const isEmpty = draftDocument.children.length === 0;
  const isDirty =
    JSON.stringify(draftDocument) !== JSON.stringify(savedDocument);
  const activeSelectedId = resolveSelectedNodeId(selectionTree, selectedId);
  const selectedNode = selectionTree.nodes[activeSelectedId];
  const selectedBuilderNode = findNode(draftDocument, activeSelectedId);
  const breadcrumb = getBreadcrumb(selectionTree, activeSelectedId);

  const selectNode = (id: string) => {
    const next = resolveSelectedNodeId(selectionTree, id);
    setSelectedId(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const moveSelection = (nextId: string | null) => {
    if (nextId) selectNode(nextId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isEditableTarget(event.target)) return;
    const keyMap: Record<string, string | null> = {
      ArrowUp: getParentNodeId(selectionTree, activeSelectedId),
      ArrowDown: getFirstChildNodeId(selectionTree, activeSelectedId),
      ArrowRight: getNextSiblingNodeId(selectionTree, activeSelectedId),
      ArrowLeft: getPreviousSiblingNodeId(selectionTree, activeSelectedId),
      Escape: BUILDER_PAGE_NODE_ID,
    };
    if (!(event.key in keyMap)) return;
    event.preventDefault();
    moveSelection(keyMap[event.key]);
  };

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

  const saveDraft = () => {
    startTransition(async () => {
      const res = await saveBuilderDocumentAction(
        entryId,
        typeSlug,
        draftDocument,
      );
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save builder content.");
        return;
      }
      setSavedDocument(draftDocument);
      toast.success("Builder content saved.");
      router.refresh();
    });
  };

  const discardDraft = () => {
    setDraftDocument(savedDocument);
    setSelectedId((current) => resolveSelectedNodeId(selectionTree, current));
    toast.message("Builder changes discarded.");
  };

  const updateProps = (nodeId: string, patch: Record<string, unknown>) => {
    setDraftDocument((current) => updateNodeProps(current, nodeId, patch));
  };

  const updateStyle = (nodeId: string, key: string, value: string) => {
    setDraftDocument((current) =>
      updateNodeBaseStyle(current, nodeId, key, value),
    );
  };

  return (
    <section
      className="bg-background overflow-hidden rounded-lg border"
      data-testid="builder-canvas"
      onKeyDown={onKeyDown}
    >
      {/* Faithful preview: the same scoped CSS the public page will emit. */}
      <style>{compiledCss}</style>

      <div className="border-b px-3 py-2">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScanLine className="text-muted-foreground size-4" />
            <h2 className="text-sm font-medium">Visual canvas</h2>
            <Badge variant={isDirty ? "secondary" : "outline"}>
              {isDirty ? "Unsaved changes" : "Saved"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              <Monitor className="size-4" />
              Desktop
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!isDirty || pending}
              onClick={discardDraft}
            >
              <RotateCcw className="size-4" />
              Discard
            </Button>
            <Button
              size="sm"
              disabled={!isDirty || pending}
              onClick={saveDraft}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Selected</span>
          <Breadcrumb nodes={breadcrumb} />
          {selectedNode ? (
            <>
              <Badge variant="secondary" data-testid="builder-selected-label">
                {selectedNode.kind}
              </Badge>
              <Badge variant="outline" data-testid="builder-selected-origin">
                {selectedNode.origin}
              </Badge>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-[34rem] lg:grid-cols-[1fr_20rem]">
        <div className="bg-muted/30 max-h-[calc(100vh-18rem)] overflow-auto p-4 md:p-6">
          <div
            className={cn(
              "bg-background mx-auto min-h-[40rem] w-full max-w-5xl shadow-sm ring-1 transition-colors",
              activeSelectedId === BUILDER_PAGE_NODE_ID
                ? "ring-ring ring-2"
                : "ring-border",
            )}
            data-testid="builder-desktop-frame"
            role="button"
            tabIndex={0}
            aria-label="Select page"
            aria-pressed={activeSelectedId === BUILDER_PAGE_NODE_ID}
            onClick={(event) => {
              event.currentTarget.focus();
              selectNode(BUILDER_PAGE_NODE_ID);
            }}
          >
            {isEmpty ? (
              <div
                className="grid min-h-[40rem] place-items-center p-8 text-center"
                data-testid="builder-empty-state"
              >
                <div className="max-w-md space-y-4">
                  <div className="bg-muted mx-auto grid size-12 place-items-center rounded-lg">
                    <Layers className="text-muted-foreground size-5" />
                  </div>
                  <div>
                    <p className="font-medium">Empty visual page</p>
                    <p className="text-muted-foreground text-sm">
                      Create a starter section to test the recursive canvas with
                      a section, container, and rich-text node.
                    </p>
                  </div>
                  <Button
                    onClick={(event) => {
                      event.stopPropagation();
                      createStarter();
                    }}
                    disabled={pending}
                  >
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
                {draftDocument.children.map((node) => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    selectionTree={selectionTree}
                    activeSelectedId={activeSelectedId}
                    onSelect={selectNode}
                    onChangeProps={updateProps}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <Inspector
          selectedNode={selectedNode}
          builderNode={selectedBuilderNode}
          onChangeProps={updateProps}
          onChangeStyle={updateStyle}
        />
      </div>
    </section>
  );
}

function Breadcrumb({ nodes }: { nodes: BuilderSelectableNode[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1"
      data-testid="builder-breadcrumb"
    >
      {nodes.map((node, index) => (
        <span key={node.id} className="flex items-center gap-1">
          {index > 0 ? <span className="text-muted-foreground">›</span> : null}
          <span className="font-medium">{node.label}</span>
        </span>
      ))}
    </div>
  );
}

function CanvasNode({
  node,
  selectionTree,
  activeSelectedId,
  onSelect,
  onChangeProps,
}: {
  node: BuilderNode;
  selectionTree: ReturnType<typeof buildSelectionTree>;
  activeSelectedId: string;
  onSelect: (id: string) => void;
  onChangeProps: (nodeId: string, patch: Record<string, unknown>) => void;
}) {
  const selectable = selectionTree.nodes[node.id];
  const kind = friendlyKind(node.type);
  const isContainer = selectable?.isContainer ?? false;

  const inner = isContainer ? (
    <div className={cn(nodeClassName(node.id), `flx-${node.type}`)}>
      {node.children.length ? (
        <div className="space-y-3">
          {node.children.map((child) => (
            <CanvasNode
              key={child.id}
              node={child}
              selectionTree={selectionTree}
              activeSelectedId={activeSelectedId}
              onSelect={onSelect}
              onChangeProps={onChangeProps}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground rounded border border-dashed p-3 text-center text-xs">
          Empty {kind} — add nodes inside it.
        </p>
      )}
    </div>
  ) : (
    <LeafPreview
      node={node}
      selected={activeSelectedId === node.id}
      onChangeProps={onChangeProps}
    />
  );

  return (
    <VisualNode
      kind={kind}
      id={node.id}
      label={selectable?.label ?? kind}
      origin={selectable?.origin ?? "page content"}
      selected={activeSelectedId === node.id}
      onSelect={onSelect}
    >
      {inner}
    </VisualNode>
  );
}

function LeafPreview({
  node,
  selected,
  onChangeProps,
}: {
  node: BuilderNode;
  selected: boolean;
  onChangeProps: (nodeId: string, patch: Record<string, unknown>) => void;
}) {
  const cls = cn(nodeClassName(node.id), `flx-${node.type}`);
  switch (node.type) {
    case "richText":
      return (
        <EditableRichText
          node={node}
          selected={selected}
          className={cls}
          onChange={(html) => onChangeProps(node.id, { html })}
        />
      );
    case "heading":
      return (
        <div className={cls}>
          {asString(node.props.text) || (
            <span className="text-muted-foreground">Heading</span>
          )}
        </div>
      );
    case "button":
      return (
        <span
          className={cn(cls, "inline-flex rounded border px-3 py-1.5 text-sm")}
        >
          {asString(node.props.label) || "Button"}
        </span>
      );
    case "image": {
      const src = asString(node.props.src);
      return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={cls} src={src} alt={asString(node.props.alt)} />
      ) : (
        <Placeholder label="Image — set a source in the inspector" />
      );
    }
    case "shortcode":
      return (
        <code className={cn(cls, "block rounded bg-muted px-2 py-1 text-xs")}>
          {asString(node.props.shortcode) || "[shortcode]"}
        </code>
      );
    case "form":
      return (
        <Placeholder
          label={`Form: ${asString(node.props.slug) || "choose a form"}`}
        />
      );
    case "html":
      return <Placeholder label="Custom HTML block" />;
    case "spacer":
      return <div className={cn(cls, "min-h-6")} />;
    default:
      return <Placeholder label={node.type} />;
  }
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="text-muted-foreground rounded border border-dashed p-3 text-center text-xs">
      {label}
    </div>
  );
}

function Inspector({
  selectedNode,
  builderNode,
  onChangeProps,
  onChangeStyle,
}: {
  selectedNode: BuilderSelectableNode | undefined;
  builderNode: BuilderNode | null;
  onChangeProps: (nodeId: string, patch: Record<string, unknown>) => void;
  onChangeStyle: (nodeId: string, key: string, value: string) => void;
}) {
  return (
    <aside
      className="bg-background border-t p-4 lg:border-t-0 lg:border-l"
      data-testid="builder-inspector"
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">Inspector</h3>
          <p className="text-muted-foreground text-xs">
            {selectedNode
              ? `${selectedNode.label} · ${selectedNode.origin}`
              : "Select a node to edit it."}
          </p>
        </div>

        {builderNode ? (
          <>
            {builderNode.type === "richText" ? (
              <RichTextInspector
                node={builderNode}
                onChange={(patch) => onChangeProps(builderNode.id, patch)}
              />
            ) : null}
            <StyleInspector
              node={builderNode}
              onChangeStyle={(key, value) =>
                onChangeStyle(builderNode.id, key, value)
              }
            />
          </>
        ) : (
          <div className="text-muted-foreground rounded-md border border-dashed p-3 text-sm">
            Select a node on the canvas to edit its content and styling.
          </div>
        )}
      </div>
    </aside>
  );
}

function RichTextInspector({
  node,
  onChange,
}: {
  node: BuilderNode;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${node.id}-html`}>Content HTML</Label>
        <Textarea
          id={`${node.id}-html`}
          data-testid="builder-richtext-html"
          value={asString(node.props.html)}
          rows={6}
          onChange={(event) => onChange({ html: event.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${node.id}-link`}>Link</Label>
        <Input
          id={`${node.id}-link`}
          data-testid="builder-richtext-link"
          value={asString(node.props.link)}
          placeholder="/about or https://example.com"
          onChange={(event) => onChange({ link: event.target.value || null })}
        />
      </div>
    </div>
  );
}

/** Token-first style controls — they write neutral CSS into the node's base styles. */
function StyleInspector({
  node,
  onChangeStyle,
}: {
  node: BuilderNode;
  onChangeStyle: (key: string, value: string) => void;
}) {
  const base: StyleMap = node.styles?.base ?? {};
  const value = (key: string) => {
    const v = base[key];
    return v == null ? "" : String(v);
  };
  return (
    <div className="space-y-3 border-t pt-4">
      <p className="text-xs font-medium">Styling</p>
      <div className="grid grid-cols-2 gap-2">
        <StyleSelect
          id={`${node.id}-display`}
          label="Display"
          value={value("display")}
          options={[
            ["", "Default"],
            ["block", "Block"],
            ["flex", "Flex"],
            ["grid", "Grid"],
          ]}
          onChange={(v) => onChangeStyle("display", v)}
        />
        <StyleSelect
          id={`${node.id}-direction`}
          label="Direction"
          value={value("flex-direction")}
          options={[
            ["", "Default"],
            ["row", "Row"],
            ["column", "Column"],
          ]}
          onChange={(v) => onChangeStyle("flex-direction", v)}
        />
        <StyleText
          id={`${node.id}-gap`}
          label="Gap"
          value={value("gap")}
          placeholder="16px"
          onChange={(v) => onChangeStyle("gap", v)}
        />
        <StyleText
          id={`${node.id}-padding`}
          label="Padding"
          value={value("padding")}
          placeholder="24px"
          onChange={(v) => onChangeStyle("padding", v)}
        />
        <StyleText
          id={`${node.id}-background`}
          label="Background"
          value={value("background")}
          placeholder="var(--color-primary)"
          onChange={(v) => onChangeStyle("background", v)}
        />
        <StyleSelect
          id={`${node.id}-align`}
          label="Text align"
          value={value("text-align")}
          options={[
            ["", "Default"],
            ["left", "Left"],
            ["center", "Center"],
            ["right", "Right"],
          ]}
          onChange={(v) => onChangeStyle("text-align", v)}
        />
      </div>
      <p className="text-muted-foreground text-[11px]">
        Values compile to scoped CSS. Use design tokens like{" "}
        <code>var(--space-6)</code> for theme consistency.
      </p>
    </div>
  );
}

function StyleText({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function StyleSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="border-input bg-background focus-visible:ring-ring/50 h-8 w-full rounded-lg border px-2 text-sm outline-none focus-visible:ring-3"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function EditableRichText({
  node,
  selected,
  className,
  onChange,
}: {
  node: BuilderNode;
  selected: boolean;
  className?: string;
  onChange: (html: string) => void;
}) {
  const html = asString(node.props.html);
  const link = asString(node.props.link);
  const content = (
    <div
      className={cn(
        "prose prose-sm focus:ring-ring/50 max-w-none rounded-sm outline-none focus:ring-2",
        className,
      )}
      contentEditable={selected}
      suppressContentEditableWarning
      data-testid="builder-inline-richtext"
      onClick={(event) => {
        if (selected) event.stopPropagation();
      }}
      onBlur={(event) => onChange(event.currentTarget.innerHTML)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return link ? (
    <a href={link} onClick={(event) => event.preventDefault()}>
      {content}
    </a>
  ) : (
    content
  );
}

function VisualNode({
  kind,
  id,
  label,
  origin,
  selected,
  onSelect,
  children,
}: {
  kind: string;
  id: string;
  label: string;
  origin: string;
  selected: boolean;
  onSelect: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group hover:outline-ring focus:outline-ring focus-within:outline-ring relative rounded-md outline outline-2 -outline-offset-2 transition-colors",
        selected ? "outline-ring" : "outline-transparent",
      )}
      data-builder-node={id}
      data-builder-kind={kind}
      data-testid={`builder-node-${kind.replace(/\s+/g, "-")}`}
      role="button"
      tabIndex={0}
      aria-label={`Select ${kind} ${label}`}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        event.currentTarget.focus();
        onSelect(id);
      }}
    >
      <div className="bg-background/95 text-muted-foreground ring-border pointer-events-none absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] opacity-0 shadow-sm ring-1 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <span>{kind}</span>
        <span>·</span>
        <span>{origin}</span>
      </div>
      <div className="border-border/70 rounded-md border border-dashed p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge variant="outline">{kind}</Badge>
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- tree helpers -----------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function findNode(document: BuilderDocument, id: string): BuilderNode | null {
  const walk = (nodes: BuilderNode[]): BuilderNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = walk(node.children);
      if (found) return found;
    }
    return null;
  };
  return walk(document.children);
}

function mapNode(
  nodes: BuilderNode[],
  id: string,
  fn: (node: BuilderNode) => BuilderNode,
): BuilderNode[] {
  return nodes.map((node) => {
    if (node.id === id) return fn(node);
    if (node.children.length) {
      return { ...node, children: mapNode(node.children, id, fn) };
    }
    return node;
  });
}

function updateNodeProps(
  document: BuilderDocument,
  id: string,
  patch: Record<string, unknown>,
): BuilderDocument {
  return {
    ...document,
    children: mapNode(document.children, id, (node) => ({
      ...node,
      props: { ...node.props, ...patch },
    })),
  };
}

function updateNodeBaseStyle(
  document: BuilderDocument,
  id: string,
  key: string,
  value: string,
): BuilderDocument {
  return {
    ...document,
    children: mapNode(document.children, id, (node) => {
      const base: StyleMap = { ...(node.styles?.base ?? {}) };
      if (value.trim()) base[key] = value.trim();
      else delete base[key];
      return { ...node, styles: { ...node.styles, base } };
    }),
  };
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
