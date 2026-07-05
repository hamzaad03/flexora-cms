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
import { GripVertical, Plus, Trash2, Save } from "lucide-react";

import {
  createFormAction,
  updateFormAction,
} from "@/app/admin/(protected)/forms/actions";
import {
  FORM_FIELD_TYPES,
  newFieldId,
  type FormField,
  type FormFieldType,
  type FormSettings,
} from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FormData = {
  id?: string;
  slug: string;
  name: string;
  isActive: boolean;
  fields: FormField[];
  settings: FormSettings;
};

const HAS_OPTIONS = new Set<FormFieldType>(["select", "radio"]);

export function FormBuilder({ form }: { form: FormData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = !form.id;

  const [name, setName] = useState(form.name);
  const [isActive, setIsActive] = useState(form.isActive);
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [settings, setSettings] = useState<FormSettings>(form.settings);

  const sensors = useSensors(useSensor(PointerSensor));

  const addField = () =>
    setFields((f) => [
      ...f,
      {
        id: newFieldId(),
        type: "text",
        name: `field_${f.length + 1}`,
        label: "New field",
        required: false,
        width: "full",
      },
    ]);

  const updateField = (id: string, patch: Partial<FormField>) =>
    setFields((f) => f.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const removeField = (id: string) =>
    setFields((f) => f.filter((x) => x.id !== id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setFields((f) => {
      const oi = f.findIndex((x) => x.id === active.id);
      const ni = f.findIndex((x) => x.id === over.id);
      return oi < 0 || ni < 0 ? f : arrayMove(f, oi, ni);
    });
  };

  const save = () => {
    const payload = {
      name,
      slug: isNew ? slugify(name) || undefined : undefined,
      isActive,
      fields,
      settings,
    };
    startTransition(async () => {
      const res = isNew
        ? await createFormAction(payload)
        : await updateFormAction(form.id!, payload);
      if (!res.ok) {
        toast.error(res.error ?? "Save failed.");
        return;
      }
      toast.success("Saved.");
      if (isNew && res.id) router.push(`/admin/forms/${res.id}`);
      else router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-xs text-base font-medium"
            placeholder="Form name"
          />
          <Button onClick={save} disabled={pending || !name}>
            <Save className="size-4" /> Save
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                {fields.map((field) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    onChange={(patch) => updateField(field.id, patch)}
                    onRemove={() => removeField(field.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button type="button" variant="outline" onClick={addField}>
              <Plus className="size-4" /> Add field
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              Active
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </label>
            <label className="flex items-center justify-between text-sm">
              Require Turnstile CAPTCHA
              <Switch
                checked={Boolean(settings.requireCaptcha)}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, requireCaptcha: v }))
                }
              />
            </label>
            <div className="space-y-1.5">
              <Label htmlFor="submitLabel">Submit button label</Label>
              <Input
                id="submitLabel"
                value={settings.submitLabel ?? ""}
                placeholder="Submit"
                onChange={(e) =>
                  setSettings((s) => ({ ...s, submitLabel: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="successMessage">Success message</Label>
              <Textarea
                id="successMessage"
                rows={2}
                value={settings.successMessage ?? ""}
                placeholder="Thanks — we'll be in touch."
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    successMessage: e.target.value,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {form.id ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Embed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Paste this shortcode into any page or post:
              </p>
              <code className="bg-muted block rounded p-2 text-xs">
                [flxform slug=&quot;{form.slug}&quot;]
              </code>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function FieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: FormField;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="bg-background space-y-2 rounded-md border p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab text-muted-foreground"
          {...attributes}
          {...listeners}
          aria-label="Drag field"
        >
          <GripVertical className="size-4" />
        </button>
        <Select
          value={field.type}
          onValueChange={(v) =>
            onChange({ type: (v ?? "text") as FormFieldType })
          }
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORM_FIELD_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="text-muted-foreground ml-auto flex items-center gap-1.5 text-xs">
          Required
          <Switch
            checked={Boolean(field.required)}
            onCheckedChange={(v) => onChange({ required: v })}
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove field"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          value={field.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Label"
        />
        <Input
          value={field.name}
          onChange={(e) =>
            onChange({ name: slugify(e.target.value).replace(/-/g, "_") })
          }
          placeholder="field_name"
        />
      </div>
      {HAS_OPTIONS.has(field.type) ? (
        <Input
          value={(field.options ?? []).join(", ")}
          onChange={(e) =>
            onChange({
              options: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Option A, Option B, Option C"
        />
      ) : null}
    </div>
  );
}
