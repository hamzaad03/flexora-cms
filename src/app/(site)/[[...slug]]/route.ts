import { NextResponse } from "next/server";

import { resolveRoute } from "@/server/services/public-router";
import { getActiveTheme } from "@/server/services/theme";
import { renderEntry, renderNotFound } from "@/server/theme/render";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlResponse(body: string, status = 200) {
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function noThemePage() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>No theme</title>
  <style>body{font-family:system-ui;margin:0;display:grid;place-items:center;min-height:100vh;color:#171717}</style>
  </head><body><div style="text-align:center"><h1>No active theme</h1>
  <p>Activate a theme in the admin to start serving your site.</p>
  <p><a href="/admin/themes">Go to Themes</a></p></div></body></html>`;
}

// Public site renderer. Serves theme-generated full HTML documents. More
// specific routes (/admin, /api, /setup, /theme-assets) take precedence; this
// optional catch-all handles everything else.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const segments = slug ?? [];

  const theme = await getActiveTheme();
  if (!theme) return htmlResponse(noThemePage(), 503);

  try {
    const resolved = await resolveRoute(segments);
    if (!resolved) {
      const body = await renderNotFound();
      return htmlResponse(body, 404);
    }
    const body = await renderEntry(
      resolved.entry,
      resolved.typeSlug,
      resolved.templateType,
    );
    return htmlResponse(body, 200);
  } catch (err) {
    logger.error(
      { err, path: "/" + segments.join("/") },
      "Public render failed",
    );
    return htmlResponse("<h1>Something went wrong</h1>", 500);
  }
}
