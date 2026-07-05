import { describe, expect, it } from "vitest";

import {
  BUILDER_DOCUMENT_VERSION,
  BuilderLimitError,
  assertWithinLimits,
  builderDocumentFromHtml,
  builderDocumentSchema,
  emptyBuilderDocument,
  migrateLegacyDocument,
  parseBuilderDocument,
  validateBuilderDocument,
  type BuilderDocument,
} from "@/lib/builder/document";

describe("builder document schema (v2 recursive)", () => {
  it("creates an empty versioned page document", () => {
    expect(emptyBuilderDocument()).toEqual({
      version: BUILDER_DOCUMENT_VERSION,
      type: "page",
      children: [],
    });
  });

  it("parses a recursive node tree with nested containers", () => {
    const doc = {
      version: 2,
      type: "page",
      children: [
        {
          id: "section_1",
          type: "section",
          props: { label: "Hero" },
          children: [
            {
              id: "container_1",
              type: "container",
              props: {},
              styles: { base: { display: "flex", gap: "16px" } },
              children: [
                {
                  id: "text_1",
                  type: "richText",
                  props: { html: "<p>Hello</p>" },
                },
                {
                  id: "container_nested",
                  type: "container",
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
    const parsed = builderDocumentSchema.parse(doc);
    expect(parsed.children[0]?.children[0]?.children[0]?.props.html).toBe(
      "<p>Hello</p>",
    );
    expect(parsed.children[0]?.children[0]?.children[1]?.type).toBe(
      "container",
    );
    // Defaults fill in missing styles/children.
    expect(parsed.children[0]?.children[0]?.children[0]?.children).toEqual([]);
  });

  it("falls back to an empty document for missing or invalid stored JSON", () => {
    expect(parseBuilderDocument(null)).toEqual(emptyBuilderDocument());
    expect(parseBuilderDocument({ version: 999, type: "page" })).toEqual(
      emptyBuilderDocument(),
    );
    expect(parseBuilderDocument("not-json")).toEqual(emptyBuilderDocument());
  });

  it("rejects unknown node types and unsafe node ids", () => {
    expect(() =>
      builderDocumentSchema.parse({
        version: 2,
        type: "page",
        children: [{ id: "../bad", type: "section", children: [] }],
      }),
    ).toThrow();
    expect(() =>
      builderDocumentSchema.parse({
        version: 2,
        type: "page",
        children: [{ id: "x", type: "script", children: [] }],
      }),
    ).toThrow();
  });

  it("migrates a stored v1 (section/container/richText) document", () => {
    const legacy = {
      version: 1,
      type: "page",
      sections: [
        {
          id: "s_1",
          type: "section",
          props: { label: "Intro" },
          children: [
            {
              id: "c_1",
              type: "container",
              props: { width: "wide" },
              children: [
                {
                  id: "t_1",
                  type: "richText",
                  props: {
                    html: "<p>Legacy</p>",
                    textAlign: "center",
                    fontSize: "xl",
                    linkHref: "/about",
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const migrated = migrateLegacyDocument(legacy);
    expect(migrated?.version).toBe(BUILDER_DOCUMENT_VERSION);
    const parsed = parseBuilderDocument(legacy);
    const text = parsed.children[0]?.children[0]?.children[0];
    expect(text?.type).toBe("richText");
    expect(text?.props.html).toBe("<p>Legacy</p>");
    expect(text?.props.link).toBe("/about");
    expect(text?.styles.base?.["text-align"]).toBe("center");
    expect(text?.styles.base?.["font-size"]).toBe("1.25rem");
  });

  it("converts existing contentHtml into a first rich-text node", () => {
    const doc = builderDocumentFromHtml("<p>Classic body</p>");
    expect(doc.children[0]?.id).toBe("section_classic");
    expect(doc.children[0]?.children[0]?.children[0]?.props.html).toBe(
      "<p>Classic body</p>",
    );
  });

  it("enforces nesting-depth limits on save", () => {
    // Build a chain of containers deeper than BUILDER_MAX_DEPTH (8).
    let node: BuilderDocument["children"][number] = {
      id: "leaf",
      type: "container",
      props: {},
      styles: {},
      children: [],
    };
    for (let i = 0; i < 10; i += 1) {
      node = {
        id: `c_${i}`,
        type: "container",
        props: {},
        styles: {},
        children: [node],
      };
    }
    const doc: BuilderDocument = {
      version: 2,
      type: "page",
      children: [node],
    };
    expect(() => assertWithinLimits(doc)).toThrow(BuilderLimitError);
    expect(() => validateBuilderDocument(doc)).toThrow(BuilderLimitError);
  });
});
