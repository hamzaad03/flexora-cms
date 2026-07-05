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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Save, Wand2 } from "lucide-react";

import {
  saveAreaAction,
  saveAssignmentsAction,
} from "@/app/admin/(protected)/layout/actions";
import {
  COMPONENT_DEFS,
  COMPONENT_DEF_MAP,
  type ComponentField,
} from "@/lib/layout-components";
import {
  type LayoutContent,
  type LayoutRow,
  type LayoutComponent,
  type AreaSettings,
  newId,
} from "@/lib/layout-types";
import type { Animation } from "@/lib/animation";
import { AnimationControl } from "./animation-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ContentTypeOption = { id: string; label: string };
type Selected = { rowId: string; colId: string; compId: string } | null;

export function LayoutBuilder({
  areaId,
  initialName,
  initialStatus,
  initialContent,
  initialSettings,
  initialIsDefault,
  initialContentTypeIds,
  contentTypes,
}: {
  areaId: string;
  initialName: string;
  initialStatus: boolean;
  initialContent: LayoutContent;
  initialSettings: AreaSettings;
  initialIsDefault: boolean;
  initialContentTypeIds: string[];
  contentTypes: ContentTypeOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState(initialStatus);
  const [settings, setSettings] = useState<AreaSettings>(initialSettings);
  const [content, setContent] = useState<LayoutContent>(initialContent);
  const [isDefault, setIsDefault] = useState(initialIsDefault);
  const [ctIds, setCtIds] = useState<string[]>(initialContentTypeIds);
  const [selected, setSelected] = useState<Selected>(null);
  const [rowAnimOpen, setRowAnimOpen] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // ---- content mutation helpers ----
  const setRows = (rows: LayoutRow[]) => setContent({ rows });

  const addRow = () =>
    setRows([
      ...content.rows,
      { id: newId("row"), columns: [{ id: newId("col"), components: [] }] },
    ]);

  const deleteRow = (rowId: string) =>
    setRows(content.rows.filter((r) => r.id !== rowId));

  const setColumns = (rowId: string, count: number) =>
    setRows(
      content.rows.map((r) => {
        if (r.id !== rowId) return r;
        const cols = [...r.columns];
        while (cols.length < count)
          cols.push({ id: newId("col"), components: [] });
        if (cols.length > count) {
          // Move orphaned components into the last kept column.
          const kept = cols.slice(0, count);
          const dropped = cols.slice(count).flatMap((c) => c.components);
          kept[count - 1] = {
            ...kept[count - 1],
            components: [...kept[count - 1].components, ...dropped],
          };
          return { ...r, columns: kept };
        }
        return { ...r, columns: cols };
      }),
    );

  const setRowAnim = (rowId: string, animation?: Animation) =>
    setRows(
      content.rows.map((r) => (r.id === rowId ? { ...r, animation } : r)),
    );

  const addComponent = (rowId: string, colId: string, type: string) =>
    setRows(
      content.rows.map((r) =>
        r.id !== rowId
          ? r
          : {
              ...r,
              columns: r.columns.map((c) =>
                c.id !== colId
                  ? c
                  : {
                      ...c,
                      components: [
                        ...c.components,
                        { id: newId("cmp"), type, props: {} },
                      ],
                    },
              ),
            },
      ),
    );

  const removeComponent = (rowId: string, colId: string, compId: string) => {
    setRows(
      content.rows.map((r) =>
        r.id !== rowId
          ? r
          : {
              ...r,
              columns: r.columns.map((c) =>
                c.id !== colId
                  ? c
                  : {
                      ...c,
                      components: c.components.filter((x) => x.id !== compId),
                    },
              ),
            },
      ),
    );
    if (selected?.compId === compId) setSelected(null);
  };

  const updateComponent = (compId: string, patch: Partial<LayoutComponent>) =>
    setRows(
      content.rows.map((r) => ({
        ...r,
        columns: r.columns.map((c) => ({
          ...c,
          components: c.components.map((x) =>
            x.id === compId ? { ...x, ...patch } : x,
          ),
        })),
      })),
    );

  const onRowDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = content.rows.findIndex((r) => r.id === active.id);
    const newIndex = content.rows.findIndex((r) => r.id === over.id);
    if (oldIndex >= 0 && newIndex >= 0)
      setRows(arrayMove(content.rows, oldIndex, newIndex));
  };

  const onComponentDragEnd =
    (rowId: string, colId: string) => (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      setRows(
        content.rows.map((r) =>
          r.id !== rowId
            ? r
            : {
                ...r,
                columns: r.columns.map((c) => {
                  if (c.id !== colId) return c;
                  const oldI = c.components.findIndex(
                    (x) => x.id === active.id,
                  );
                  const newI = c.components.findIndex((x) => x.id === over.id);
                  return oldI < 0 || newI < 0
                    ? c
                    : { ...c, components: arrayMove(c.components, oldI, newI) };
                }),
              },
        ),
      );
    };

  // ---- persistence ----
  const save = () =>
    startTransition(async () => {
      const res = await saveAreaAction(areaId, {
        name,
        status,
        content,
        settings,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Save failed.");
        return;
      }
      const a = await saveAssignmentsAction(areaId, {
        isDefault,
        contentTypeIds: ctIds,
        entryIds: [],
      });
      if (!a.ok) toast.error(a.error ?? "Assignments failed.");
      else toast.success("Saved.");
      router.refresh();
    });

  const selectedComp = selected
    ? content.rows
        .find((r) => r.id === selected.rowId)
        ?.columns.find((c) => c.id === selected.colId)
        ?.components.find((x) => x.id === selected.compId)
    : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-xs text-base font-medium"
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={status} onCheckedChange={setStatus} /> Enabled
          </label>
          <Button onClick={save} disabled={pending}>
            <Save className="size-4" /> Save
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Canvas */}
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onRowDragEnd}
          >
            <SortableContext
              items={content.rows.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {content.rows.map((row) => (
                <SortableRow key={row.id} id={row.id}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Columns</Label>
                      <Select
                        value={String(row.columns.length)}
                        onValueChange={(v) =>
                          setColumns(row.id, Number(v ?? "1"))
                        }
                      >
                        <SelectTrigger className="h-7 w-16">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {row.animation && row.animation.type !== "none" ? (
                        <Badge variant="outline">{row.animation.type}</Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Row animation"
                        onClick={() =>
                          setRowAnimOpen(rowAnimOpen === row.id ? null : row.id)
                        }
                      >
                        <Wand2 className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete row"
                        onClick={() => deleteRow(row.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {rowAnimOpen === row.id ? (
                    <div className="bg-muted/40 mb-2 rounded-md p-2">
                      <AnimationControl
                        value={row.animation}
                        onChange={(a) => setRowAnim(row.id, a)}
                      />
                    </div>
                  ) : null}

                  <div
                    className="grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${row.columns.length}, minmax(0,1fr))`,
                    }}
                  >
                    {row.columns.map((col) => (
                      <div
                        key={col.id}
                        className="bg-muted/30 min-h-16 space-y-2 rounded-md border border-dashed p-2"
                      >
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={onComponentDragEnd(row.id, col.id)}
                        >
                          <SortableContext
                            items={col.components.map((c) => c.id)}
                            strategy={horizontalListSortingStrategy}
                          >
                            <div className="flex flex-wrap gap-2">
                              {col.components.map((comp) => (
                                <SortableComponent
                                  key={comp.id}
                                  id={comp.id}
                                  label={
                                    COMPONENT_DEF_MAP[comp.type]?.label ??
                                    comp.type
                                  }
                                  active={selected?.compId === comp.id}
                                  animated={
                                    !!comp.animation &&
                                    comp.animation.type !== "none"
                                  }
                                  onSelect={() =>
                                    setSelected({
                                      rowId: row.id,
                                      colId: col.id,
                                      compId: comp.id,
                                    })
                                  }
                                  onRemove={() =>
                                    removeComponent(row.id, col.id, comp.id)
                                  }
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                        <ComponentPicker
                          onPick={(type) => addComponent(row.id, col.id, type)}
                        />
                      </div>
                    ))}
                  </div>
                </SortableRow>
              ))}
            </SortableContext>
          </DndContext>

          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="size-4" /> Add row
          </Button>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedComp ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {COMPONENT_DEF_MAP[selectedComp.type]?.label ??
                    selectedComp.type}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PropEditor
                  comp={selectedComp}
                  onChange={(props) =>
                    updateComponent(selectedComp.id, { props })
                  }
                />
                <div className="space-y-2 border-t pt-3">
                  <Label className="text-xs font-medium">Animation</Label>
                  <AnimationControl
                    value={selectedComp.animation}
                    onChange={(a) =>
                      updateComponent(selectedComp.id, { animation: a })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-6 text-center text-sm">
                Select a component to edit its properties & animation.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(
                [
                  ["sticky", "Sticky"],
                  ["transparent", "Transparent"],
                  ["blur", "Blur background"],
                ] as const
              ).map(([key, lbl]) => (
                <label
                  key={key}
                  className="flex items-center justify-between text-sm"
                >
                  {lbl}
                  <Switch
                    checked={Boolean(settings[key])}
                    onCheckedChange={(v) =>
                      setSettings((p) => ({ ...p, [key]: v }))
                    }
                  />
                </label>
              ))}
              <div className="space-y-1">
                <Label className="text-xs">Scroll behavior</Label>
                <Select
                  value={settings.scroll ?? "none"}
                  onValueChange={(v) =>
                    setSettings((p) => ({
                      ...p,
                      scroll: (v ?? "none") as AreaSettings["scroll"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="hide-on-down">
                      Hide on scroll down
                    </SelectItem>
                    <SelectItem value="smart">Smart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center justify-between text-sm">
                Use as default
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </label>
              <div className="space-y-1.5">
                <Label className="text-xs">Apply to content types</Label>
                {contentTypes.map((ct) => (
                  <label
                    key={ct.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={ctIds.includes(ct.id)}
                      onChange={(e) =>
                        setCtIds((p) =>
                          e.target.checked
                            ? [...p, ct.id]
                            : p.filter((x) => x !== ct.id),
                        )
                      }
                    />
                    {ct.label}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="bg-background rounded-lg border p-3"
    >
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground mb-1 cursor-grab"
        {...attributes}
        {...listeners}
        aria-label="Drag row"
      >
        <GripVertical className="size-4" />
      </button>
      {children}
    </div>
  );
}

function SortableComponent({
  id,
  label,
  active,
  animated,
  onSelect,
  onRemove,
}: {
  id: string;
  label: string;
  active: boolean;
  animated: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${
        active ? "border-primary bg-primary/5" : "bg-background"
      }`}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag component"
      >
        <GripVertical className="size-3.5" />
      </button>
      <button type="button" onClick={onSelect} className="font-medium">
        {label}
      </button>
      {animated ? <span title="Animated">✨</span> : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove component"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

function ComponentPicker({ onPick }: { onPick: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={(props) => (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="xs"
            className="w-full justify-start"
          >
            <Plus className="size-3.5" /> Add component
          </Button>
        )}
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a component</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMPONENT_DEFS.map((d) => (
            <Button
              key={d.type}
              type="button"
              variant="outline"
              onClick={() => {
                onPick(d.type);
                setOpen(false);
              }}
            >
              {d.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropEditor({
  comp,
  onChange,
}: {
  comp: LayoutComponent;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const def = COMPONENT_DEF_MAP[comp.type];
  if (!def || def.fields.length === 0) {
    return <p className="text-muted-foreground text-xs">No properties.</p>;
  }
  const set = (key: string, value: unknown) =>
    onChange({ ...comp.props, [key]: value });

  return (
    <div className="space-y-3">
      {def.fields.map((f: ComponentField) => {
        const raw = comp.props[f.key];
        if (f.kind === "select") {
          return (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Select
                value={(raw as string) ?? f.options?.[0] ?? ""}
                onValueChange={(v) => set(f.key, v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(f.options ?? []).map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (f.kind === "textarea" || f.kind === "json") {
          const text =
            f.kind === "json"
              ? raw != null
                ? JSON.stringify(raw, null, 2)
                : ""
              : ((raw as string) ?? "");
          return (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              <Textarea
                rows={4}
                defaultValue={text}
                placeholder={f.placeholder}
                onBlur={(e) => {
                  if (f.kind === "json") {
                    try {
                      set(
                        f.key,
                        e.target.value ? JSON.parse(e.target.value) : undefined,
                      );
                    } catch {
                      /* ignore invalid JSON until valid */
                    }
                  } else {
                    set(f.key, e.target.value);
                  }
                }}
              />
            </div>
          );
        }
        return (
          <div key={f.key} className="space-y-1">
            <Label className="text-xs">{f.label}</Label>
            <Input
              value={(raw as string) ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}
