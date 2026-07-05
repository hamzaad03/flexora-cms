import { describe, expect, it } from "vitest";

import { renderBuilderDocument } from "@/lib/builder/render";
import type { BuilderDocument } from "@/lib/builder/document";

function docWith(children: BuilderDocument["children"]): BuilderDocument {
  return { version: 2, type: "page", children };
}

describe("renderBuilderDocument", () => {
  it("renders rich text with scoped class + compiles base styles to scoped CSS", () => {
    const doc = docWith([
      {
        id: "sec1",
        type: "section",
        props: {},
        styles: { base: { padding: "40px 0" } },
        children: [
          {
            id: "txt1",
            type: "richText",
            props: { html: "<h2>Hello</h2>", link: "/about" },
            styles: { base: { "text-align": "center" }, md: { gap: "16px" } },
            children: [],
          },
        ],
      },
    ]);

    const { html, css } = renderBuilderDocument(doc);
    expect(html).toContain('data-flx-node="txt1"');
    expect(html).toContain("flx-node-txt1");
    expect(html).toContain('href="/about"');
    expect(css).toContain(".flx-node-sec1{padding:40px 0}");
    expect(css).toContain(".flx-node-txt1{text-align:center}");
    expect(css).toContain("@media (min-width:768px){.flx-node-txt1{gap:16px}}");
  });

  it("removes unsafe rich-text HTML and unsafe links", () => {
    const doc = docWith([
      {
        id: "txt1",
        type: "richText",
        props: {
          html: '<p onclick="x()">Hi</p><script>x()</script>',
          link: "javascript:alert(1)",
        },
        styles: {},
        children: [],
      },
    ]);
    const { html } = renderBuilderDocument(doc);
    expect(html).toContain("<p>Hi</p>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("script");
    expect(html).not.toContain("javascript:");
  });

  it("drops unsafe CSS values during compilation", () => {
    const doc = docWith([
      {
        id: "box",
        type: "container",
        props: {},
        styles: {
          base: {
            background: "url(javascript:alert(1))", // unsafe → dropped
            color: "red; position:fixed", // declaration break-out → dropped
            padding: "var(--space-6)", // safe → kept
            "z-index": "999", // allowed
            "pointer-events": "none", // not whitelisted → dropped
          },
        },
        children: [],
      },
    ]);
    const { css } = renderBuilderDocument(doc);
    expect(css).toContain("padding:var(--space-6)");
    expect(css).toContain("z-index:999");
    expect(css).not.toContain("javascript:");
    expect(css).not.toContain("position:fixed");
    expect(css).not.toContain("pointer-events");
  });

  it("passes shortcodes and form blocks through unescaped for the page.html hook", () => {
    const doc = docWith([
      {
        id: "sc1",
        type: "shortcode",
        props: { shortcode: '[flxform slug="contact"]' },
        styles: {},
        children: [],
      },
      {
        id: "form1",
        type: "form",
        props: { slug: "newsletter" },
        styles: {},
        children: [],
      },
    ]);
    const { html } = renderBuilderDocument(doc);
    expect(html).toContain('[flxform slug="contact"]');
    expect(html).toContain('[flxform slug="newsletter"]');
  });
});
