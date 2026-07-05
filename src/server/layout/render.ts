import "server-only";

import { animAttrString } from "@/lib/animation";
import type { AreaSettings, LayoutContent } from "@/lib/layout-types";
import { renderComponent, type LayoutRenderCtx } from "./registry";

/** Render a layout area's content_json to an HTML string (for theme injection). */
export function renderLayoutArea(
  content: LayoutContent | null | undefined,
  settings: AreaSettings | null | undefined,
  ctx: LayoutRenderCtx,
): string {
  if (!content?.rows?.length) return "";

  const rowsHtml = content.rows
    .map((row) => {
      const colsHtml = (row.columns ?? [])
        .map((col) => {
          const comps = (col.components ?? [])
            .map((c) => {
              const html = renderComponent(c.type, c.props ?? {}, ctx);
              const a = animAttrString(c.animation);
              return a ? `<div class="flx-component" ${a}>${html}</div>` : html;
            })
            .join("");
          return `<div class="flx-col">${comps}</div>`;
        })
        .join("");
      const a = animAttrString(row.animation);
      return `<div class="flx-row"${a ? " " + a : ""}>${colsHtml}</div>`;
    })
    .join("");

  const s = settings ?? {};
  const cls = ["flx-region"];
  if (s.sticky) cls.push("flx-sticky");
  if (s.transparent) cls.push("flx-transparent");
  if (s.blur) cls.push("flx-blur");

  const scrollAttr =
    s.scroll && s.scroll !== "none" ? ` data-scroll="${s.scroll}"` : "";
  const style = s.maxWidth
    ? ` style="--flx-container:${s.maxWidth.replace(/"/g, "")}"`
    : "";

  return `<div class="${cls.join(" ")}"${scrollAttr}${style}><div class="flx-region__inner">${rowsHtml}</div></div>`;
}
