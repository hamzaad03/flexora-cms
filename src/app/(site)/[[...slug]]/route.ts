import { NextResponse } from "next/server";

import {
  listPublishedEntries,
  resolveRoute,
} from "@/server/services/public-router";
import { getActiveTheme } from "@/server/services/theme";
import {
  renderArchive,
  renderEntry,
  renderNotFound,
} from "@/server/theme/render";
import { matchRedirect } from "@/server/services/redirect";
import { injectSiteScripts } from "@/server/services/site-scripts";
import { hooks, HOOKS } from "@/server/hooks";
import { ensurePluginsLoaded } from "@/server/services/plugins";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inject layout CSS when a region is present, and the lazy GSAP runtime when
// any element carries an animation. Theme-agnostic post-processing.
function enhanceLayout(html: string): string {
  let out = html;
  if (out.includes("flx-region") && !out.includes("/flx-layout.css")) {
    const link = '<link rel="stylesheet" href="/flx-layout.css" />';
    out = out.includes("</head>")
      ? out.replace("</head>", `${link}</head>`)
      : link + out;
  }
  if (out.includes("data-anim=") && !out.includes("/flx-anim.js")) {
    const script = '<script src="/flx-anim.js" defer></script>';
    out = out.includes("</body>")
      ? out.replace("</body>", `${script}</body>`)
      : out + script;
  }
  return out;
}

async function finalize(html: string, status = 200) {
  let out = await injectSiteScripts(enhanceLayout(html));
  await ensurePluginsLoaded();
  out = await hooks.applyFilters(HOOKS.pageHtml, out);
  return new NextResponse(out, {
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
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const segments = slug ?? [];
  const path = "/" + segments.join("/");

  // 1) Redirects take precedence.
  const redirect = await matchRedirect(path);
  if (redirect) {
    return NextResponse.redirect(
      new URL(redirect.to, req.url),
      redirect.code === 302 ? 302 : 301,
    );
  }

  const theme = await getActiveTheme();
  if (!theme) return finalize(noThemePage(), 503);

  try {
    const resolved = await resolveRoute(segments);
    if (!resolved) {
      // Built-in blog listing at /blog, unless a page already claims that slug.
      if (path === "/blog") {
        const posts = await listPublishedEntries("post");
        return finalize(
          await renderArchive(posts, "post", { title: "Blog" }),
          200,
        );
      }
      return finalize(await renderNotFound(), 404);
    }
    const body = await renderEntry(
      resolved.entry,
      resolved.typeSlug,
      resolved.templateType,
    );
    return finalize(body, 200);
  } catch (err) {
    logger.error({ err, path }, "Public render failed");
    return finalize("<h1>Something went wrong</h1>", 500);
  }
}
