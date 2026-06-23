import { z } from "zod";

export const ENTRY_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
  "TRASHED",
] as const;

export const entryInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  slug: z.string().max(255).optional(),
  status: z.enum(ENTRY_STATUSES).default("DRAFT"),
  excerpt: z.string().max(500).optional().nullable(),
  contentHtml: z.string().optional().default(""),
  templateId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  featuredMedia: z.string().optional().nullable(),
  // ISO string; required when status is SCHEDULED.
  publishedAt: z.string().optional().nullable(),
  // taxonomy slug -> list of term names (created on demand)
  terms: z.record(z.string(), z.array(z.string())).optional(),
  // custom field machine-name -> value
  fields: z.record(z.string(), z.unknown()).optional(),
});
export type EntryInput = z.infer<typeof entryInputSchema>;

export const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "select",
  "media",
  "date",
] as const;

export const fieldInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z][a-z0-9_]*$/, "lowercase letters, numbers, underscore"),
  label: z.string().min(1),
  type: z.enum(FIELD_TYPES),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type FieldInput = z.infer<typeof fieldInputSchema>;

export const contentTypeInputSchema = z.object({
  label: z.string().min(1, "Plural label is required"),
  labelSingular: z.string().min(1, "Singular label is required"),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]*$/, "kebab-case")
    .optional(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  supports: z
    .object({
      seo: z.boolean().default(true),
      revisions: z.boolean().default(true),
      author: z.boolean().default(true),
      hierarchical: z.boolean().default(false),
      taxonomies: z.array(z.string()).default([]),
    })
    .partial()
    .optional(),
});
export type ContentTypeInput = z.infer<typeof contentTypeInputSchema>;
