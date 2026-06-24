import { z } from "zod";

export const BUILDER_DOCUMENT_VERSION = 1;

const nodeBaseSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+$/, "Node id must be stable and URL-safe."),
});

export const richTextBlockSchema = nodeBaseSchema.extend({
  type: z.literal("richText"),
  props: z.object({
    html: z.string().max(100_000).default(""),
  }),
});

export const containerNodeSchema = nodeBaseSchema.extend({
  type: z.literal("container"),
  props: z
    .object({
      width: z.enum(["narrow", "default", "wide", "full"]).default("default"),
    })
    .default({ width: "default" }),
  children: z.array(richTextBlockSchema).default([]),
});

export const sectionNodeSchema = nodeBaseSchema.extend({
  type: z.literal("section"),
  props: z
    .object({
      label: z.string().max(80).optional(),
    })
    .default({}),
  children: z.array(containerNodeSchema).default([]),
});

export const builderDocumentSchema = z.object({
  version: z.literal(BUILDER_DOCUMENT_VERSION),
  type: z.literal("page"),
  sections: z.array(sectionNodeSchema).default([]),
});

export type BuilderDocument = z.infer<typeof builderDocumentSchema>;
export type BuilderSectionNode = z.infer<typeof sectionNodeSchema>;
export type BuilderContainerNode = z.infer<typeof containerNodeSchema>;
export type BuilderRichTextBlock = z.infer<typeof richTextBlockSchema>;

export function emptyBuilderDocument(): BuilderDocument {
  return {
    version: BUILDER_DOCUMENT_VERSION,
    type: "page",
    sections: [],
  };
}

export function starterBuilderDocument(): BuilderDocument {
  return {
    version: BUILDER_DOCUMENT_VERSION,
    type: "page",
    sections: [
      {
        id: "section_intro",
        type: "section",
        props: { label: "Intro" },
        children: [
          {
            id: "container_intro",
            type: "container",
            props: { width: "default" },
            children: [
              {
                id: "text_intro",
                type: "richText",
                props: {
                  html: "<h2>Start building visually</h2><p>This starter section proves the canvas can render sections, containers, and rich-text blocks.</p>",
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export function parseBuilderDocument(value: unknown): BuilderDocument {
  if (value == null) return emptyBuilderDocument();
  const parsed = builderDocumentSchema.safeParse(value);
  return parsed.success ? parsed.data : emptyBuilderDocument();
}

export function validateBuilderDocument(value: unknown): BuilderDocument {
  return builderDocumentSchema.parse(value);
}
