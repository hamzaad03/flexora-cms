import { describe, expect, it } from "vitest";

import {
  BUILDER_DOCUMENT_VERSION,
  builderDocumentSchema,
  emptyBuilderDocument,
  parseBuilderDocument,
} from "@/lib/builder/document";

describe("builder document schema", () => {
  it("creates an empty versioned page document", () => {
    expect(emptyBuilderDocument()).toEqual({
      version: BUILDER_DOCUMENT_VERSION,
      type: "page",
      sections: [],
    });
  });

  it("parses a valid page/section/container/rich-text document", () => {
    const doc = {
      version: 1,
      type: "page",
      sections: [
        {
          id: "s_1",
          type: "section",
          props: { label: "Hero" },
          children: [
            {
              id: "c_1",
              type: "container",
              props: { width: "wide" },
              children: [
                {
                  id: "t_1",
                  type: "richText",
                  props: { html: "<p>Hello</p>" },
                },
              ],
            },
          ],
        },
      ],
    };

    const parsed = builderDocumentSchema.parse(doc);
    expect(parsed.sections[0]?.children[0]?.children[0]?.props.html).toBe(
      "<p>Hello</p>",
    );
  });

  it("falls back to an empty document for missing or invalid stored JSON", () => {
    expect(parseBuilderDocument(null)).toEqual(emptyBuilderDocument());
    expect(parseBuilderDocument({ version: 999, type: "page" })).toEqual(
      emptyBuilderDocument(),
    );
    expect(parseBuilderDocument("not-json")).toEqual(emptyBuilderDocument());
  });

  it("rejects unsupported document versions", () => {
    expect(() =>
      builderDocumentSchema.parse({
        version: 2,
        type: "page",
        sections: [],
      }),
    ).toThrow();
  });

  it("rejects unknown node types and unsafe node ids", () => {
    expect(() =>
      builderDocumentSchema.parse({
        version: 1,
        type: "page",
        sections: [{ id: "../bad", type: "section", children: [] }],
      }),
    ).toThrow();
    expect(() =>
      builderDocumentSchema.parse({
        version: 1,
        type: "page",
        sections: [{ id: "x", type: "script", children: [] }],
      }),
    ).toThrow();
  });
});
