"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Trash2,
  IndentIncrease,
  IndentDecrease,
  Save,
} from "lucide-react";

import { saveMenuAction } from "@/app/admin/(protected)/menus/actions";
import type { MenuTreeNode } from "@/server/services/menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type EntryOption = { id: string; label: string; type: string };

type Node = {
  _id: string;
  label: string;
  type: string;
  url: string | null;
  reference: string | null;
  target: string;
  config: Record<string, unknown> | null;
  children: Node[];
};

const uid = () => `n_${Math.random().toString(36).slice(2, 9)}`;

function toClient(nodes: MenuTreeNode[]): Node[] {
  return nodes.map((n) => ({
    ...n,
    _id: uid(),
    children: toClient(n.children),
  }));
}
function toServer(nodes: Node[]): MenuTreeNode[] {
  return nodes.map(({ _id: _drop, children, ...rest }) => {
    void _drop;
    return { ...rest, children: toServer(children) };
  });
}

// Apply fn to the sibling-array containing `id`.
function transformSiblings(
  nodes: Node[],
  id: string,
  fn: (list: Node[], idx: number) => Node[],
): { nodes: Node[]; done: boolean } {
  const idx = nodes.findIndex((n) => n._id === id);
  if (idx >= 0) return { nodes: fn(nodes, idx), done: true };
  for (let i = 0; i < nodes.length; i++) {
    const r = transformSiblings(nodes[i].children, id, fn);
    if (r.done) {
      const copy = [...nodes];
      copy[i] = { ...nodes[i], children: r.nodes };
      return { nodes: copy, done: true };
    }
  }
  return { nodes, done: false };
}

function mapNode(nodes: Node[], id: string, patch: Partial<Node>): Node[] {
  return nodes.map((n) =>
    n._id === id
      ? { ...n, ...patch }
      : { ...n, children: mapNode(n.children, id, patch) },
  );
}

function removeNode(nodes: Node[], id: string): Node[] {
  return nodes
    .filter((n) => n._id !== id)
    .map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

// Move a node up one level (becomes sibling right after its parent).
function outdentNode(nodes: Node[], id: string): Node[] {
  return nodes.flatMap((n) => {
    const ci = n.children.findIndex((c) => c._id === id);
    if (ci >= 0) {
      const child = n.children[ci];
      const rest = [...n.children];
      rest.splice(ci, 1);
      return [{ ...n, children: rest }, child];
    }
    return [{ ...n, children: outdentNode(n.children, id) }];
  });
}

export function MenuBuilder({
  menuId,
  initialTree,
  entries,
}: {
  menuId: string;
  initialTree: MenuTreeNode[];
  entries: EntryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tree, setTree] = useState<Node[]>(() => toClient(initialTree));
  const sensors = useSensors(useSensor(PointerSensor));

  const update = (id: string, patch: Partial<Node>) =>
    setTree((t) => mapNode(t, id, patch));
  const remove = (id: string) => setTree((t) => removeNode(t, id));
  const addChild = (id: string) =>
    setTree((t) =>
      mapNodeChildren(t, id, (children) => [...children, blankNode()]),
    );
  const addRoot = () => setTree((t) => [...t, blankNode()]);

  const indent = (id: string) =>
    setTree(
      (t) =>
        transformSiblings(t, id, (list, idx) => {
          if (idx === 0) return list;
          const node = list[idx];
          const prev = list[idx - 1];
          const copy = [...list];
          copy.splice(idx, 1);
          copy[idx - 1] = { ...prev, children: [...prev.children, node] };
          return copy;
        }).nodes,
    );

  const outdent = (id: string) => setTree((t) => outdentNode(t, id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setTree(
      (t) =>
        transformSiblings(t, String(active.id), (list, idx) => {
          const overIdx = list.findIndex((n) => n._id === over.id);
          if (overIdx < 0) return list; // different sibling list — ignore
          return arrayMove(list, idx, overIdx);
        }).nodes,
    );
  };

  const save = () =>
    startTransition(async () => {
      const res = await saveMenuAction(menuId, toServer(tree));
      if (res.ok) {
        toast.success("Menu saved.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Save failed.");
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addRoot}>
          <Plus className="size-4" /> Add item
        </Button>
        <Button onClick={save} disabled={pending}>
          <Save className="size-4" /> Save menu
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <NodeList
          nodes={tree}
          entries={entries}
          onUpdate={update}
          onRemove={remove}
          onAddChild={addChild}
          onIndent={indent}
          onOutdent={outdent}
          depth={0}
        />
      </DndContext>

      {tree.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No items yet. Add your first menu item.
        </p>
      ) : null}
    </div>
  );
}

function blankNode(): Node {
  return {
    _id: uid(),
    label: "New item",
    type: "custom",
    url: "#",
    reference: null,
    target: "_self",
    config: null,
    children: [],
  };
}

function mapNodeChildren(
  nodes: Node[],
  id: string,
  fn: (children: Node[]) => Node[],
): Node[] {
  return nodes.map((n) =>
    n._id === id
      ? { ...n, children: fn(n.children) }
      : { ...n, children: mapNodeChildren(n.children, id, fn) },
  );
}

function NodeList(props: {
  nodes: Node[];
  entries: EntryOption[];
  depth: number;
  onUpdate: (id: string, patch: Partial<Node>) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
}) {
  const { nodes } = props;
  return (
    <SortableContext
      items={nodes.map((n) => n._id)}
      strategy={verticalListSortingStrategy}
    >
      <ul className="space-y-2">
        {nodes.map((node) => (
          <NodeItem key={node._id} node={node} {...props} />
        ))}
      </ul>
    </SortableContext>
  );
}

function NodeItem({
  node,
  entries,
  depth,
  onUpdate,
  onRemove,
  onAddChild,
  onIndent,
  onOutdent,
}: {
  node: Node;
  entries: EntryOption[];
  depth: number;
  onUpdate: (id: string, patch: Partial<Node>) => void;
  onRemove: (id: string) => void;
  onAddChild: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: node._id });
  const [open, setOpen] = useState(false);
  const refEntries = entries.filter((e) =>
    node.type === "post" ? e.type === "post" : e.type !== "post",
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="bg-background flex items-center gap-2 rounded-md border p-2">
        <button
          type="button"
          className="cursor-grab text-muted-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag item"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          className="flex-1 text-left text-sm font-medium"
          onClick={() => setOpen((o) => !o)}
        >
          {node.label || "(untitled)"}
          <span className="text-muted-foreground ml-2 text-xs">
            {node.type}
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Outdent"
          onClick={() => onOutdent(node._id)}
        >
          <IndentDecrease className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Indent"
          onClick={() => onIndent(node._id)}
        >
          <IndentIncrease className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Add child"
          onClick={() => onAddChild(node._id)}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete"
          onClick={() => onRemove(node._id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {open ? (
        <div className="bg-muted/30 mt-1 grid gap-2 rounded-md border p-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={node.label}
              onChange={(e) => onUpdate(node._id, { label: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select
              value={node.type}
              onValueChange={(v) => onUpdate(node._id, { type: v ?? "custom" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom URL</SelectItem>
                <SelectItem value="page">Page</SelectItem>
                <SelectItem value="post">Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {node.type === "custom" ? (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">URL</Label>
              <Input
                value={node.url ?? ""}
                onChange={(e) => onUpdate(node._id, { url: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Linked entry</Label>
              <Select
                value={node.reference ?? ""}
                onValueChange={(v) =>
                  onUpdate(node._id, { reference: v ?? null })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {refEntries.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <label className="flex items-center justify-between text-sm">
            Open in new tab
            <Switch
              checked={node.target === "_blank"}
              onCheckedChange={(v) =>
                onUpdate(node._id, { target: v ? "_blank" : "_self" })
              }
            />
          </label>
          {node.children.length > 0 ? (
            <label className="flex items-center justify-between text-sm">
              Mega menu
              <Switch
                checked={Boolean(node.config?.mega)}
                onCheckedChange={(v) =>
                  onUpdate(node._id, {
                    config: { ...(node.config ?? {}), mega: v },
                  })
                }
              />
            </label>
          ) : null}
        </div>
      ) : null}

      {node.children.length > 0 ? (
        <div className="mt-2 border-l pl-4">
          <NodeList
            nodes={node.children}
            entries={entries}
            depth={depth + 1}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onAddChild={onAddChild}
            onIndent={onIndent}
            onOutdent={onOutdent}
          />
        </div>
      ) : null}
    </li>
  );
}
