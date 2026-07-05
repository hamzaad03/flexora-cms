import { z } from "zod";

/**
 * Builder document v2 — a recursive, framework-neutral node tree.
 *
 * v1 stored a closed `section → container → richText` shape with enum-only props
 * styled through build-time Tailwind classes. v2 stores ONE recursive `BuilderNode`
 * whose styling is a neutral CSS-property map compiled to scoped CSS at render time
 * (see `./styles`). The admin UI may use Tailwind, but the saved page format never
 * does — output is portable HTML + compiled CSS.
 */
export const BUILDER_DOCUMENT_VERSION = 2;

export const BUILDER_NODE_TYPES = [
  "section",
  "container",
  "grid",
  "richText",
  "heading",
  "image",
  "button",
  "icon",
  "shortcode",
  "html",
  "form",
  "spacer",
] as const;
export type BuilderNodeType = (typeof BUILDER_NODE_TYPES)[number];

/** Node types that exist to hold other nodes. */
export const BUILDER_CONTAINER_TYPES: ReadonlySet<BuilderNodeType> = new Set([
  "section",
  "container",
  "grid",
]);

// Guard rails so a deeply nested or huge document can't break render/perf.
export const BUILDER_MAX_DEPTH = 8;
export const BUILDER_MAX_NODES = 500;
export const BUILDER_MAX_CHILDREN = 60;

const idSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/, "Node id must be stable and URL-safe.");

const styleValueSchema = z.union([z.string().max(400), z.number()]);
/** A neutral CSS-property map, e.g. `{ "padding": "var(--space-6)", "gap": "16px" }`. */
const styleMapSchema = z.record(z.string().max(60), styleValueSchema);

const responsiveStylesSchema = z
  .object({
    base: styleMapSchema.optional(),
    sm: styleMapSchema.optional(),
    md: styleMapSchema.optional(),
    lg: styleMapSchema.optional(),
    hover: styleMapSchema.optional(),
  })
  .default({});

export type StyleMap = z.infer<typeof styleMapSchema>;
export type ResponsiveStyles = z.infer<typeof responsiveStylesSchema>;
export const STYLE_BREAKPOINTS = ["base", "sm", "md", "lg", "hover"] as const;
export type StyleBreakpoint = (typeof STYLE_BREAKPOINTS)[number];

export type BuilderNode = {
  id: string;
  type: BuilderNodeType;
  props: Record<string, unknown>;
  styles: ResponsiveStyles;
  advancedCss?: string;
  children: BuilderNode[];
};

export const builderNodeSchema: z.ZodType<BuilderNode> = z.lazy(() =>
  z.object({
    id: idSchema,
    type: z.enum(BUILDER_NODE_TYPES),
    props: z.record(z.string(), z.unknown()).default({}),
    styles: responsiveStylesSchema,
    advancedCss: z.string().max(4000).optional(),
    children: z.array(builderNodeSchema).max(BUILDER_MAX_CHILDREN).default([]),
  }),
);

export const builderDocumentSchema = z.object({
  version: z.literal(BUILDER_DOCUMENT_VERSION),
  type: z.literal("page"),
  children: z.array(builderNodeSchema).max(BUILDER_MAX_CHILDREN).default([]),
});

export type BuilderDocument = z.infer<typeof builderDocumentSchema>;

/** Back-compat alias: a rich-text element is just a `BuilderNode` of type "richText". */
export type BuilderRichTextNode = BuilderNode;

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${rand}`;
}

export function emptyBuilderDocument(): BuilderDocument {
  return { version: BUILDER_DOCUMENT_VERSION, type: "page", children: [] };
}

export function starterBuilderDocument(): BuilderDocument {
  return {
    version: BUILDER_DOCUMENT_VERSION,
    type: "page",
    children: [
      {
        id: "section_intro",
        type: "section",
        props: { label: "Intro" },
        styles: { base: { padding: "var(--space-8, 2rem) 0" } },
        children: [
          {
            id: "container_intro",
            type: "container",
            props: {},
            styles: {
              base: {
                "max-width": "72rem",
                "margin-left": "auto",
                "margin-right": "auto",
                padding: "0 1.5rem",
              },
            },
            children: [
              {
                id: "text_intro",
                type: "richText",
                props: {
                  html: "<h2>Start building visually</h2><p>Add containers, nest them, and style each one. This starter proves the recursive canvas renders nodes and compiled CSS.</p>",
                },
                styles: {},
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Wrap raw HTML (classic Tiptap output) into a single rich-text node — no content loss. */
export function builderDocumentFromHtml(
  html: string | null | undefined,
): BuilderDocument {
  const content = (html ?? "").trim();
  if (!content) return emptyBuilderDocument();
  return {
    version: BUILDER_DOCUMENT_VERSION,
    type: "page",
    children: [
      {
        id: "section_classic",
        type: "section",
        props: { label: "Classic content" },
        styles: {},
        children: [
          {
            id: "container_classic",
            type: "container",
            props: {},
            styles: {
              base: {
                "max-width": "72rem",
                "margin-left": "auto",
                "margin-right": "auto",
                padding: "0 1.5rem",
              },
            },
            children: [
              {
                id: "text_classic",
                type: "richText",
                props: { html: content },
                styles: {},
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

// --- v1 → v2 migration ------------------------------------------------------

const LEGACY_FONT_SIZE: Record<string, string> = {
  sm: "0.875rem",
  base: "1rem",
  lg: "1.125rem",
  xl: "1.25rem",
};
const LEGACY_FONT_WEIGHT: Record<string, string> = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};
const LEGACY_WIDTH: Record<string, string | null> = {
  narrow: "40rem",
  default: "72rem",
  wide: "88rem",
  full: null,
};

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function legacyId(value: unknown, prefix: string): string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
    ? value
    : genId(prefix);
}

function migrateLegacyRichText(node: unknown): BuilderNode {
  const obj = asObject(node) ?? {};
  const props = asObject(obj.props) ?? {};
  const base: StyleMap = {};
  if (typeof props.textAlign === "string") base["text-align"] = props.textAlign;
  if (typeof props.fontSize === "string" && LEGACY_FONT_SIZE[props.fontSize]) {
    base["font-size"] = LEGACY_FONT_SIZE[props.fontSize];
  }
  if (
    typeof props.fontWeight === "string" &&
    LEGACY_FONT_WEIGHT[props.fontWeight]
  ) {
    base["font-weight"] = LEGACY_FONT_WEIGHT[props.fontWeight];
  }
  return {
    id: legacyId(obj.id, "text"),
    type: "richText",
    props: {
      html: typeof props.html === "string" ? props.html : "",
      link: typeof props.linkHref === "string" ? props.linkHref : null,
    },
    styles: Object.keys(base).length ? { base } : {},
    children: [],
  };
}

function migrateLegacyContainer(node: unknown): BuilderNode {
  const obj = asObject(node) ?? {};
  const props = asObject(obj.props) ?? {};
  const base: StyleMap = {
    "margin-left": "auto",
    "margin-right": "auto",
    padding: "0 1.5rem",
  };
  const width = typeof props.width === "string" ? props.width : "default";
  const maxWidth = LEGACY_WIDTH[width];
  if (maxWidth) base["max-width"] = maxWidth;
  const children = Array.isArray(obj.children) ? obj.children : [];
  return {
    id: legacyId(obj.id, "container"),
    type: "container",
    props: {},
    styles: { base },
    children: children.map(migrateLegacyRichText),
  };
}

function migrateLegacySection(node: unknown): BuilderNode {
  const obj = asObject(node) ?? {};
  const props = asObject(obj.props) ?? {};
  const children = Array.isArray(obj.children) ? obj.children : [];
  return {
    id: legacyId(obj.id, "section"),
    type: "section",
    props: typeof props.label === "string" ? { label: props.label } : {},
    styles: {},
    children: children.map(migrateLegacyContainer),
  };
}

/** Convert a stored v1 document (`{ version:1, sections:[...] }`) to a v2 tree. */
export function migrateLegacyDocument(value: unknown): BuilderDocument | null {
  const obj = asObject(value);
  if (!obj) return null;
  if (obj.version === BUILDER_DOCUMENT_VERSION) return null;
  if (!Array.isArray(obj.sections)) return null;
  return {
    version: BUILDER_DOCUMENT_VERSION,
    type: "page",
    children: obj.sections.map(migrateLegacySection),
  };
}

// --- parsing / validation ---------------------------------------------------

/** Safe parse for stored JSON: never throws; migrates v1; falls back to empty. */
export function parseBuilderDocument(value: unknown): BuilderDocument {
  if (value == null) return emptyBuilderDocument();
  const direct = builderDocumentSchema.safeParse(value);
  if (direct.success) return direct.data;
  const migrated = migrateLegacyDocument(value);
  if (migrated) {
    const reparsed = builderDocumentSchema.safeParse(migrated);
    if (reparsed.success) return reparsed.data;
  }
  return emptyBuilderDocument();
}

export class BuilderLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuilderLimitError";
  }
}

/** Walk the tree enforcing depth/total-node limits (used on save). */
export function assertWithinLimits(document: BuilderDocument): void {
  let total = 0;
  const walk = (nodes: BuilderNode[], depth: number) => {
    if (depth > BUILDER_MAX_DEPTH) {
      throw new BuilderLimitError(
        `Builder nesting exceeds the maximum depth of ${BUILDER_MAX_DEPTH}.`,
      );
    }
    for (const node of nodes) {
      total += 1;
      if (total > BUILDER_MAX_NODES) {
        throw new BuilderLimitError(
          `Builder document exceeds the maximum of ${BUILDER_MAX_NODES} nodes.`,
        );
      }
      walk(node.children, depth + 1);
    }
  };
  walk(document.children, 1);
}

/** Strict parse + limit enforcement (used before persisting). */
export function validateBuilderDocument(value: unknown): BuilderDocument {
  const document = builderDocumentSchema.parse(value);
  assertWithinLimits(document);
  return document;
}
