"use client";

import { useMemo } from "react";

import type { SeoData } from "./entry-editor";
import { analyzeSeo, scoreColor } from "@/lib/seo-score";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_DOT: Record<string, string> = {
  good: "bg-green-500",
  warn: "bg-yellow-500",
  bad: "bg-red-500",
};

export function SeoPanel({
  value,
  onChange,
  title,
  contentHtml,
}: {
  value: SeoData;
  onChange: (v: SeoData) => void;
  title: string;
  contentHtml: string;
}) {
  const set = (patch: Partial<SeoData>) => onChange({ ...value, ...patch });

  const analysis = useMemo(
    () =>
      analyzeSeo({
        title,
        metaTitle: value.title,
        metaDescription: value.description,
        focusKeyword: value.focusKeyword,
        contentHtml,
      }),
    [title, contentHtml, value.title, value.description, value.focusKeyword],
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">SEO</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Score</span>
          <span
            className="inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: scoreColor(analysis.score) }}
          >
            {analysis.score}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seo-keyword">Focus keyword</Label>
            <Input
              id="seo-keyword"
              value={value.focusKeyword}
              onChange={(e) => set({ focusKeyword: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-title">SEO title</Label>
            <Input
              id="seo-title"
              value={value.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={title}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seo-desc">Meta description</Label>
          <Textarea
            id="seo-desc"
            rows={2}
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
          />
          <p className="text-muted-foreground text-xs">
            {value.description.length} characters
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="seo-canonical">Canonical URL</Label>
            <Input
              id="seo-canonical"
              value={value.canonical}
              onChange={(e) => set({ canonical: e.target.value })}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-robots">Robots</Label>
            <Input
              id="seo-robots"
              value={value.robots}
              onChange={(e) => set({ robots: e.target.value })}
              placeholder="index,follow"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-og">OG image URL</Label>
            <Input
              id="seo-og"
              value={value.ogImage}
              onChange={(e) => set({ ogImage: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-schema">Schema (JSON-LD)</Label>
            <Textarea
              id="seo-schema"
              rows={2}
              value={value.schema}
              onChange={(e) => set({ schema: e.target.value })}
              placeholder='{"@context":"https://schema.org",…}'
            />
          </div>
        </div>

        <ul className="space-y-1.5 border-t pt-3">
          {analysis.checks.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <span
                className={`size-2 shrink-0 rounded-full ${STATUS_DOT[c.status]}`}
              />
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">{c.label}:</span>{" "}
                {c.message}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
