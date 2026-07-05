import { describe, expect, it } from "vitest";

import type { BuilderDocument } from "@/lib/builder/document";
import {
  BUILDER_PAGE_NODE_ID,
  buildSelectionTree,
  getBreadcrumb,
  getFirstChildNodeId,
  getNextSiblingNodeId,
  getParentNodeId,
  getPreviousSiblingNodeId,
  resolveSelectedNodeId,
} from "@/lib/builder/selection";

function documentWithNesting(): BuilderDocument {
  return {
    version: 2,
    type: "page",
    children: [
      {
        id: "section_a",
        type: "section",
        props: { label: "A" },
        styles: {},
        children: [
          {
            id: "container_empty",
            type: "container",
            props: {},
            styles: {},
            children: [],
          },
          {
            id: "container_full",
            type: "container",
            props: {},
            styles: {},
            children: [
              {
                id: "text_a",
                type: "richText",
                props: { html: "<p>A</p>" },
                styles: {},
                children: [],
              },
              {
                id: "container_nested",
                type: "container",
                props: {},
                styles: {},
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("builder selection tree (recursive)", () => {
  it("builds nested page, section, and arbitrarily nested container nodes", () => {
    const tree = buildSelectionTree(documentWithNesting());
    expect(tree.nodes[BUILDER_PAGE_NODE_ID].children).toEqual(["section_a"]);
    expect(tree.nodes.section_a.children).toEqual([
      "container_empty",
      "container_full",
    ]);
    expect(tree.nodes.container_full.children).toEqual([
      "text_a",
      "container_nested",
    ]);
    expect(tree.nodes.text_a.origin).toBe("page content");
    expect(tree.nodes.container_full.isContainer).toBe(true);
    expect(tree.nodes.text_a.isContainer).toBe(false);
  });

  it("creates breadcrumbs for deeply nested selected nodes", () => {
    const tree = buildSelectionTree(documentWithNesting());
    expect(
      getBreadcrumb(tree, "container_nested").map((node) => node.kind),
    ).toEqual(["page", "section", "container", "container"]);
  });

  it("supports parent, previous sibling, next sibling, and first child movement", () => {
    const tree = buildSelectionTree(documentWithNesting());
    expect(getParentNodeId(tree, "text_a")).toBe("container_full");
    expect(getPreviousSiblingNodeId(tree, "container_full")).toBe(
      "container_empty",
    );
    expect(getNextSiblingNodeId(tree, "container_empty")).toBe(
      "container_full",
    );
    expect(getFirstChildNodeId(tree, BUILDER_PAGE_NODE_ID)).toBe("section_a");
    expect(getFirstChildNodeId(tree, "container_full")).toBe("text_a");
  });

  it("keeps empty containers selectable", () => {
    const tree = buildSelectionTree(documentWithNesting());
    expect(tree.nodes.container_empty.kind).toBe("container");
    expect(tree.nodes.container_empty.children).toEqual([]);
    expect(resolveSelectedNodeId(tree, "container_empty")).toBe(
      "container_empty",
    );
  });

  it("falls back to page selection when requested node is missing", () => {
    const tree = buildSelectionTree(documentWithNesting());
    expect(resolveSelectedNodeId(tree, "missing")).toBe(BUILDER_PAGE_NODE_ID);
  });
});
