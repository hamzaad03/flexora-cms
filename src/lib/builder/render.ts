import {
  parseBuilderDocument,
  type BuilderDocument,
  type BuilderNode,
} from "./document";
import { compileDocumentCss, nodeClassName } from "./styles";
import { sanitizeBlockHtml, sanitizeRichText } from "@/lib/sanitize";

export type BuilderRenderResult = {
  /** Body HTML (sanitized per node). */
  html: string;
  /** Scoped stylesheet for every node (no <style> wrapper). */
  css: string;
};

function escAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safeHref(value: unknown): string | null {
  const href = str(value).trim();
  if (!href) return null;
  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^(https?:|mailto:|tel:)/i.test(href)
  ) {
    return href;
  }
  return null;
}

function safeSrc(value: unknown): string | null {
  const src = str(value).trim();
  if (!src) return null;
  if (/^(https?:\/\/|\/|data:image\/)/i.test(src)) return src;
  return null;
}

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Common opening tag with the scoped class + node marker + animation hooks. */
function open(
  tag: string,
  node: BuilderNode,
  semanticClass: string,
  extraAttrs = "",
): string {
  const classes = `${nodeClassName(node.id)} ${semanticClass}`;
  const anim = str(node.props.anim);
  const animAttr = anim ? ` data-anim="${escAttr(anim)}"` : "";
  const parallax = node.props.parallax === true ? ` data-parallax="true"` : "";
  return `<${tag} class="${classes}" data-flx-node="${escAttr(node.id)}"${animAttr}${parallax}${extraAttrs}>`;
}

function renderChildren(nodes: BuilderNode[]): string {
  return nodes.map(renderNode).join("");
}

function renderNode(node: BuilderNode): string {
  switch (node.type) {
    case "section":
      return `${open("section", node, "flx-section")}${renderChildren(node.children)}</section>`;
    case "container":
      return `${open("div", node, "flx-container")}${renderChildren(node.children)}</div>`;
    case "grid":
      return `${open("div", node, "flx-grid")}${renderChildren(node.children)}</div>`;
    case "richText": {
      const html = sanitizeRichText(str(node.props.html));
      const href = safeHref(node.props.link);
      const body = href
        ? `<a href="${escAttr(href)}" class="flx-builder-link">${html}</a>`
        : html;
      return `${open("div", node, "flx-rich-text")}${body}</div>`;
    }
    case "heading": {
      const level = str(node.props.level).toLowerCase();
      const tag = HEADING_TAGS.has(level) ? level : "h2";
      return `${open(tag, node, "flx-heading")}${escText(str(node.props.text))}</${tag}>`;
    }
    case "button": {
      const href = safeHref(node.props.href) ?? "#";
      const label = escText(str(node.props.label) || "Button");
      return `${open("a", node, "flx-button", ` href="${escAttr(href)}"`)}${label}</a>`;
    }
    case "image": {
      const src = safeSrc(node.props.src);
      if (!src) return "";
      const alt = escAttr(str(node.props.alt));
      return `${open("figure", node, "flx-image")}<img src="${escAttr(src)}" alt="${alt}" loading="lazy" /></figure>`;
    }
    case "icon": {
      // Render a sanitized inline SVG/icon name placeholder; keep markup safe.
      const label = escText(str(node.props.name));
      return `${open("span", node, "flx-icon")}${label}</span>`;
    }
    case "shortcode": {
      // Pass the raw shortcode through unescaped so the page.html hook can replace it.
      const code = str(node.props.shortcode).trim();
      return `${open("div", node, "flx-shortcode")}${code}</div>`;
    }
    case "form": {
      const slug = str(node.props.slug).trim();
      if (!slug) return "";
      // Reuse the existing forms shortcode pipeline.
      return `${open("div", node, "flx-form-block")}[flxform slug="${escAttr(slug)}"]</div>`;
    }
    case "html": {
      const html = sanitizeBlockHtml(str(node.props.html));
      return `${open("div", node, "flx-html")}${html}</div>`;
    }
    case "spacer":
      return `${open("div", node, "flx-spacer")}</div>`;
    default:
      // Unknown / future node type — skip gracefully so a live page never breaks.
      return "";
  }
}

export function renderBuilderDocument(
  document: BuilderDocument,
): BuilderRenderResult {
  return {
    html: renderChildren(document.children),
    css: compileDocumentCss(document),
  };
}

/** Parse stored JSON (with v1 migration) and render to `{ html, css }`. */
export function renderBuilderJson(value: unknown): BuilderRenderResult {
  return renderBuilderDocument(parseBuilderDocument(value));
}
