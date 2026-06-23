import "server-only";
import type { ContentEntry } from "@prisma/client";

import { getActiveTheme } from "@/server/services/theme";
import { parseManifest } from "./manifest";
import { getEngine } from "./engine";
import { buildBaseContext, type PageContext } from "./context";

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
    content: entry.contentHtml ?? "",
    featured_image: entry.featuredMedia,
    published_at: entry.publishedAt,
  };
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

  return engine.renderFile(templatePath, { ...base, page });
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
  return engine.renderFile(templatePath, {
    ...base,
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

  return engine.renderFile(templatePath, {
    ...base,
    page: { title: opts.title, slug: "", url: "", type: typeSlug },
    posts,
  });
}
