import "server-only";
import type { ContentEntry } from "@prisma/client";

import { getActiveTheme } from "@/server/services/theme";
import { getSeo } from "@/server/services/seo";
import { renderRegion } from "@/server/services/layout";
import { hooks, HOOKS } from "@/server/hooks";
import { ensurePluginsLoaded } from "@/server/services/plugins";
import type { LayoutRenderCtx } from "@/server/layout/registry";
import type { ResolvedMenuItem } from "@/server/services/menu";
import { renderBuilderJson } from "@/lib/builder/render";
import { BUILDER_ENABLED } from "@/lib/builder/config";
import { parseManifest } from "./manifest";
import { getEngine } from "./engine";
import {
  buildBaseContext,
  type BaseContext,
  type PageContext,
} from "./context";

/** Resolve + render the header/footer regions for a request. */
async function buildRegions(
  base: BaseContext,
  contentTypeId: string | null,
  entryId: string | null,
) {
  const ctx: LayoutRenderCtx = {
    site: base.site,
    menus: base.menus as Record<string, ResolvedMenuItem[]>,
  };
  const [header, footer] = await Promise.all([
    renderRegion("HEADER", contentTypeId, entryId, ctx),
    renderRegion("FOOTER", contentTypeId, entryId, ctx),
  ]);
  return { header, footer };
}

export class NoActiveThemeError extends Error {
  constructor() {
    super("No active theme is set.");
    this.name = "NoActiveThemeError";
  }
}

export class TemplateNotFoundError extends Error {
  constructor(type: string) {
    super(`No template for type "${type}" in the active theme.`);
    this.name = "TemplateNotFoundError";
  }
}

function entryToPageContext(
  entry: ContentEntry,
  typeSlug: string,
): PageContext {
  return {
    title: entry.title,
    slug: entry.slug,
    url: `/${entry.slug}`,
    type: typeSlug,
    excerpt: entry.excerpt,
    content: resolveEntryContent(entry),
    featured_image: entry.featuredMedia,
    published_at: entry.publishedAt,
  };
}

/**
 * The public site uses visual-builder output ONLY when the entry opted into
 * builder mode AND the builder is enabled. Otherwise it renders the classic
 * `contentHtml` (Tiptap output / builder write-back), preserving shortcodes.
 * This replaces the old unconditional `builderHtml || contentHtml` precedence
 * that silently dropped classic content.
 */
function resolveEntryContent(entry: ContentEntry): string {
  if (BUILDER_ENABLED && entry.editorMode === "builder") {
    const { html, css } = renderBuilderJson(entry.contentJson);
    if (html) {
      return css ? `<style>${css}</style>${html}` : html;
    }
  }
  return entry.contentHtml ?? "";
}

/** Resolve the template file path for a given template type from the manifest. */
function resolveTemplatePath(
  manifest: ReturnType<typeof parseManifest>,
  templateType: string,
): string {
  const path = manifest.templates[templateType] ?? manifest.templates["page"];
  if (!path) throw new TemplateNotFoundError(templateType);
  return path;
}

/** Render a single content entry through the active theme. */
export async function renderEntry(
  entry: ContentEntry,
  typeSlug: string,
  templateType: string,
): Promise<string> {
  const theme = await getActiveTheme();
  if (!theme) throw new NoActiveThemeError();

  const manifest = parseManifest(theme.manifest);
  const templatePath = resolveTemplatePath(manifest, templateType);
  const engine = getEngine(theme.slug);

  const base = await buildBaseContext();
  const page = entryToPageContext(entry, typeSlug);
  const region = await buildRegions(base, entry.contentTypeId, entry.id);

  const meta = await getSeo(entry.id);
  const seo = {
    title: meta?.title || page.title,
    description: meta?.description || page.excerpt || base.site.tagline,
    canonical: meta?.canonical || `${base.site.url}${page.url}`,
    robots: meta?.robots || "index,follow",
    og_image: meta?.ogImage || page.featured_image,
    // Escape "<" so a JSON-LD value can't break out of the <script> tag.
    schema: meta?.schema
      ? JSON.stringify(meta.schema).replace(/</g, "\\u003c")
      : null,
  };

  await ensurePluginsLoaded();
  const context = await hooks.applyFilters(HOOKS.pageContext, {
    ...base,
    page,
    region,
    seo,
  });
  return engine.renderFile(templatePath, context);
}

/** Render the theme's 404 template. */
export async function renderNotFound(
  title = "Page not found",
): Promise<string> {
  const theme = await getActiveTheme();
  if (!theme) throw new NoActiveThemeError();

  const manifest = parseManifest(theme.manifest);
  const templatePath = manifest.templates["404"] ?? manifest.templates["page"];
  if (!templatePath) throw new TemplateNotFoundError("404");

  const engine = getEngine(theme.slug);
  const base = await buildBaseContext();
  const region = await buildRegions(base, null, null);
  return engine.renderFile(templatePath, {
    ...base,
    region,
    page: { title, slug: "", url: "", type: "404", content: "" },
  });
}

/** Render an archive/listing through the active theme. */
export async function renderArchive(
  entries: ContentEntry[],
  typeSlug: string,
  opts: { title: string },
): Promise<string> {
  const theme = await getActiveTheme();
  if (!theme) throw new NoActiveThemeError();

  const manifest = parseManifest(theme.manifest);
  const templatePath = resolveTemplatePath(manifest, "archive");
  const engine = getEngine(theme.slug);

  const base = await buildBaseContext();
  const posts = entries.map((e) => entryToPageContext(e, typeSlug));
  const region = await buildRegions(base, null, null);

  return engine.renderFile(templatePath, {
    ...base,
    region,
    page: { title: opts.title, slug: "", url: "", type: typeSlug },
    posts,
  });
}
