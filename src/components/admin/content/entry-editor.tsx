"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  createEntryAction,
  updateEntryAction,
} from "@/app/admin/(protected)/content/[type]/actions";
import { RichText } from "@/components/admin/editor/rich-text";
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

export type FieldDef = {
  id: string;
  name: string;
  label: string;
  type: string;
  config: Record<string, unknown> | null;
};
export type TemplateOption = { id: string; label: string };
export type TaxonomyOption = { slug: string; label: string };
export type EntryData = {
  id?: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "TRASHED";
  excerpt: string;
  contentHtml: string;
  templateId: string | null;
  publishedAt: string | null;
  terms: Record<string, string[]>;
  fields: Record<string, unknown>;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EntryEditor({
  typeSlug,
  typeLabel,
  fields,
  templates,
  taxonomies,
  entry,
  canPublish,
}: {
  typeSlug: string;
  typeLabel: string;
  fields: FieldDef[];
  templates: TemplateOption[];
  taxonomies: TaxonomyOption[];
  entry: EntryData;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState(entry.title);
  const [slug, setSlug] = useState(entry.slug);
  const [status, setStatus] = useState(entry.status);
  const [excerpt, setExcerpt] = useState(entry.excerpt);
  const [contentHtml, setContentHtml] = useState(entry.contentHtml);
  const [templateId, setTemplateId] = useState(entry.templateId ?? "");
  const [publishedAt, setPublishedAt] = useState(
    toLocalInput(entry.publishedAt),
  );
  const [terms, setTerms] = useState<Record<string, string>>(
    Object.fromEntries(
      taxonomies.map((t) => [t.slug, (entry.terms[t.slug] ?? []).join(", ")]),
    ),
  );
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(
    entry.fields,
  );

  const isNew = !entry.id;

  const save = () => {
    const payload = {
      title,
      slug: slug || undefined,
      status,
      excerpt: excerpt || null,
      contentHtml,
      templateId: templateId || null,
      publishedAt:
        status === "SCHEDULED" || status === "PUBLISHED"
          ? publishedAt
            ? new Date(publishedAt).toISOString()
            : null
          : null,
      terms: Object.fromEntries(
        Object.entries(terms).map(([k, v]) => [
          k,
          v
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        ]),
      ),
      fields: fieldValues,
    };

    startTransition(async () => {
      const res = isNew
        ? await createEntryAction(typeSlug, payload)
        : await updateEntryAction(entry.id!, typeSlug, payload);

      if (!res.ok) {
        toast.error(res.error ?? "Save failed.");
        return;
      }
      toast.success("Saved.");
      if (isNew && res.id) {
        router.push(`/admin/content/${typeSlug}/${res.id}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* Main column */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${typeLabel} title`}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label>Content</Label>
          <RichText value={contentHtml} onChange={setContentHtml} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Short summary used in listings and SEO."
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as EntryData["status"])}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED" disabled={!canPublish}>
                    Published
                  </SelectItem>
                  <SelectItem value="SCHEDULED" disabled={!canPublish}>
                    Scheduled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {status === "SCHEDULED" ? (
              <div className="space-y-1.5">
                <Label htmlFor="publishedAt">Publish at</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>
            ) : null}
            <Button
              onClick={save}
              disabled={pending || !title}
              className="w-full"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {isNew ? "Create" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto from title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template">Template</Label>
              <Select
                value={templateId || "__default"}
                onValueChange={(v) =>
                  setTemplateId(!v || v === "__default" ? "" : v)
                }
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default">Default</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {taxonomies.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Taxonomies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taxonomies.map((tax) => (
                <div key={tax.slug} className="space-y-1.5">
                  <Label htmlFor={`tax-${tax.slug}`}>{tax.label}</Label>
                  <Input
                    id={`tax-${tax.slug}`}
                    value={terms[tax.slug] ?? ""}
                    onChange={(e) =>
                      setTerms((p) => ({ ...p, [tax.slug]: e.target.value }))
                    }
                    placeholder="comma, separated"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {fields.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((f) => (
                <CustomField
                  key={f.id}
                  def={f}
                  value={fieldValues[f.name]}
                  onChange={(v) =>
                    setFieldValues((p) => ({ ...p, [f.name]: v }))
                  }
                />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function CustomField({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `field-${def.name}`;
  const options = (def.config?.options as string[] | undefined) ?? [];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{def.label}</Label>
      {def.type === "textarea" ? (
        <Textarea
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : def.type === "boolean" ? (
        <div>
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(c) => onChange(c)}
          />
        </div>
      ) : def.type === "number" ? (
        <Input
          id={id}
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      ) : def.type === "date" ? (
        <Input
          id={id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : def.type === "select" ? (
        <Select
          value={(value as string) ?? ""}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
