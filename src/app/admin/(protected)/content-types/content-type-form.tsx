"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { createContentTypeAction, updateContentTypeAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export type ContentTypeData = {
  id?: string;
  slug: string;
  label: string;
  labelSingular: string;
  description: string;
  icon: string;
  supports: {
    seo: boolean;
    revisions: boolean;
    author: boolean;
    hierarchical: boolean;
    taxonomies: string[];
  };
};

export function ContentTypeForm({ data }: { data: ContentTypeData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isNew = !data.id;

  const [label, setLabel] = useState(data.label);
  const [labelSingular, setLabelSingular] = useState(data.labelSingular);
  const [slug, setSlug] = useState(data.slug);
  const [description, setDescription] = useState(data.description);
  const [icon, setIcon] = useState(data.icon);
  const [supports, setSupports] = useState(data.supports);
  const [taxonomies, setTaxonomies] = useState(
    data.supports.taxonomies.join(", "),
  );

  const save = () => {
    const payload = {
      label,
      labelSingular,
      slug: isNew ? slug || undefined : undefined,
      description: description || null,
      icon: icon || null,
      supports: {
        ...supports,
        taxonomies: taxonomies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    };
    startTransition(async () => {
      const res = isNew
        ? await createContentTypeAction(payload)
        : await updateContentTypeAction(data.id!, payload);
      if (!res.ok) {
        toast.error(res.error ?? "Save failed.");
        return;
      }
      toast.success("Saved.");
      if (isNew && res.id) router.push(`/admin/content-types/${res.id}`);
      else router.refresh();
    });
  };

  const toggle = (key: keyof typeof supports) => (v: boolean) =>
    setSupports((p) => ({ ...p, [key]: v }));

  return (
    <div className="max-w-xl space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="labelSingular">Singular label</Label>
          <Input
            id="labelSingular"
            value={labelSingular}
            onChange={(e) => setLabelSingular(e.target.value)}
            placeholder="Service"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="label">Plural label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Services"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from label"
          disabled={!isNew}
        />
        {!isNew ? (
          <p className="text-muted-foreground text-xs">
            Slug is fixed after creation.
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="icon">Icon (lucide name)</Label>
        <Input
          id="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="file-text"
        />
      </div>

      <fieldset className="space-y-3 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">Supports</legend>
        {(
          [
            ["seo", "SEO meta"],
            ["revisions", "Revisions"],
            ["author", "Author"],
            ["hierarchical", "Hierarchy (parent/child)"],
          ] as const
        ).map(([key, lbl]) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={`s-${key}`}>{lbl}</Label>
            <Switch
              id={`s-${key}`}
              checked={supports[key]}
              onCheckedChange={toggle(key)}
            />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label htmlFor="taxonomies">Taxonomies (slugs)</Label>
          <Input
            id="taxonomies"
            value={taxonomies}
            onChange={(e) => setTaxonomies(e.target.value)}
            placeholder="category, tag"
          />
        </div>
      </fieldset>

      <Button onClick={save} disabled={pending || !label || !labelSingular}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {isNew ? "Create content type" : "Save changes"}
      </Button>
    </div>
  );
}
