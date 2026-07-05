import "server-only";
import { Liquid } from "liquidjs";

import { themeAbsoluteDir } from "./paths";

// One LiquidJS engine per theme slug, cached. The engine is sandboxed to the
// theme's directory (no fs access outside `root`) and logic-limited by Liquid
// itself (no arbitrary JS execution).
const engines = new Map<string, Liquid>();

export function getEngine(slug: string): Liquid {
  const cached = engines.get(slug);
  if (cached) return cached;

  const engine = new Liquid({
    root: themeAbsoluteDir(slug),
    partials: themeAbsoluteDir(slug),
    layouts: themeAbsoluteDir(slug),
    extname: ".liquid",
    cache: process.env.NODE_ENV === "production",
    jsTruthy: true,
    strictFilters: false,
    strictVariables: false,
  });

  // {{ 'css/style.css' | asset }} -> /theme-assets/<slug>/css/style.css
  engine.registerFilter("asset", (input: unknown) => {
    const rel = String(input ?? "").replace(/^\/+/, "");
    return `/theme-assets/${slug}/${rel}`;
  });

  engines.set(slug, engine);
  return engine;
}

/** Clear cached engine(s) — call after install/activate/customizer changes. */
export function invalidateThemeCache(slug?: string): void {
  if (slug) engines.delete(slug);
  else engines.clear();
}
