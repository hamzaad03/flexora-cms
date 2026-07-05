import {
  type BuilderDocument,
  type BuilderNode,
  type StyleBreakpoint,
  type StyleMap,
} from "./document";

/**
 * Token-first scoped-CSS compiler.
 *
 * Builder controls write a neutral CSS-property map per node (`styles{}`) plus an
 * optional raw-CSS escape hatch (`advancedCss`). Both compile to scoped rules keyed
 * by a generated class (`.flx-node-<id>`), so the output is portable and never
 * depends on Tailwind being aware of the value at build time.
 *
 * Safety is enforced here: only whitelisted CSS properties are emitted, and every
 * value is sanitized to prevent declaration break-out / selector injection / script
 * execution — important because these pages render inside untrusted uploaded themes.
 */

export const STYLE_MEDIA: Record<
  Exclude<StyleBreakpoint, "base" | "hover">,
  number
> = {
  sm: 640,
  md: 768,
  lg: 1024,
};

/** CSS properties the builder is allowed to emit (kebab-case). */
const ALLOWED_PROPERTIES = new Set<string>([
  // box / layout
  "display",
  "box-sizing",
  "flex-direction",
  "flex-wrap",
  "justify-content",
  "align-items",
  "align-content",
  "align-self",
  "justify-self",
  "gap",
  "row-gap",
  "column-gap",
  "order",
  "flex",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "grid-template-columns",
  "grid-template-rows",
  "grid-auto-flow",
  "grid-column",
  "grid-row",
  // sizing
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "aspect-ratio",
  // spacing
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  // typography
  "color",
  "font-size",
  "font-weight",
  "font-family",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "white-space",
  // background / border / effects
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "background-attachment",
  "background-clip",
  "border",
  "border-width",
  "border-style",
  "border-color",
  "border-radius",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "box-shadow",
  "opacity",
  "filter",
  "backdrop-filter",
  "transform",
  "transition",
  "object-fit",
  "object-position",
  "overflow",
  "overflow-x",
  "overflow-y",
  // positioning
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "inset",
]);

function toKebab(key: string): string {
  return key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function urlsAreSafe(value: string): boolean {
  const matches = value.match(/url\(([^)]*)\)/gi);
  if (!matches) return true;
  return matches.every((raw) => {
    const inner = raw
      .replace(/^url\(\s*['"]?/i, "")
      .replace(/['"]?\s*\)$/i, "")
      .trim();
    return /^(https?:\/\/|\/|data:image\/)/i.test(inner);
  });
}

/** Sanitize a single declaration value; returns null if it must be dropped. */
export function sanitizeCssValue(raw: string | number): string | null {
  const value = String(raw).trim();
  if (!value || value.length > 400) return null;
  // No selector/declaration break-out, no at-rules, no tags.
  if (/[<>{}\\;]/.test(value)) return null;
  if (/@import|@charset/i.test(value)) return null;
  if (/expression\s*\(/i.test(value)) return null;
  if (/(javascript|vbscript|data:text\/html):/i.test(value)) return null;
  if (!urlsAreSafe(value)) return null;
  return value;
}

function compileDeclarations(styles: StyleMap | undefined): string {
  if (!styles) return "";
  const decls: string[] = [];
  for (const [rawKey, rawValue] of Object.entries(styles)) {
    const prop = toKebab(rawKey);
    if (!ALLOWED_PROPERTIES.has(prop)) continue;
    const value = sanitizeCssValue(rawValue);
    if (value == null) continue;
    decls.push(`${prop}:${value}`);
  }
  return decls.join(";");
}

/**
 * Sanitize a raw-CSS escape-hatch block. It may only contain declarations (no
 * selectors / braces), so it can be safely wrapped under the node's scoped class.
 */
export function sanitizeAdvancedCss(raw: string | undefined): string {
  if (!raw) return "";
  let value = raw.slice(0, 4000);
  value = value.replace(/<\/?[^>]*>/g, ""); // strip any tags
  if (/[{}<>]/.test(value)) return ""; // declarations only — no nested rules
  if (/@import|@charset|expression\s*\(|(javascript|vbscript):/i.test(value)) {
    return "";
  }
  // Re-sanitize each declaration's value half.
  const declarations = value
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const idx = decl.indexOf(":");
      if (idx < 0) return null;
      const prop = toKebab(decl.slice(0, idx));
      const val = decl.slice(idx + 1).trim();
      if (!ALLOWED_PROPERTIES.has(prop)) return null;
      if (!val || val.length > 400 || !urlsAreSafe(val)) return null;
      return `${prop}:${val}`;
    })
    .filter((decl): decl is string => decl != null);
  return declarations.join(";");
}

/** The generated, collision-safe class for a node (id is validated URL-safe). */
export function nodeClassName(id: string): string {
  return `flx-node-${id}`;
}

/** Compile one node's styles + advancedCss into scoped CSS rules. */
export function compileNodeCss(node: BuilderNode): string {
  const selector = `.${nodeClassName(node.id)}`;
  const rules: string[] = [];

  const base = compileDeclarations(node.styles?.base);
  if (base) rules.push(`${selector}{${base}}`);

  for (const bp of ["sm", "md", "lg"] as const) {
    const decls = compileDeclarations(node.styles?.[bp]);
    if (decls) {
      rules.push(
        `@media (min-width:${STYLE_MEDIA[bp]}px){${selector}{${decls}}}`,
      );
    }
  }

  const hover = compileDeclarations(node.styles?.hover);
  if (hover) rules.push(`${selector}:hover{${hover}}`);

  const advanced = sanitizeAdvancedCss(node.advancedCss);
  if (advanced) rules.push(`${selector}{${advanced}}`);

  return rules.join("");
}

/** Walk the document and compile every node's scoped CSS into one stylesheet. */
export function compileDocumentCss(document: BuilderDocument): string {
  const out: string[] = [];
  const walk = (nodes: BuilderNode[]) => {
    for (const node of nodes) {
      const css = compileNodeCss(node);
      if (css) out.push(css);
      walk(node.children);
    }
  };
  walk(document.children);
  return out.join("");
}
