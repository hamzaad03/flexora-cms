import {
  BUILDER_CONTAINER_TYPES,
  type BuilderDocument,
  type BuilderNode,
  type BuilderNodeType,
} from "./document";

export const BUILDER_PAGE_NODE_ID = "__page__";

export type BuilderSelectableKind = "page" | BuilderNodeType;

export type BuilderNodeOrigin =
  | "page content"
  | "global region"
  | "template inherited"
  | "plugin block"
  | "locked element";

export type BuilderSelectableNode = {
  id: string;
  kind: BuilderSelectableKind;
  label: string;
  origin: BuilderNodeOrigin;
  parentId: string | null;
  children: string[];
  /** Whether this node may hold children (section/container/grid). */
  isContainer: boolean;
};

export type BuilderSelectionTree = {
  rootId: string;
  nodes: Record<string, BuilderSelectableNode>;
};

const TYPE_LABEL: Record<BuilderNodeType, string> = {
  section: "Section",
  container: "Container",
  grid: "Grid",
  richText: "Rich text",
  heading: "Heading",
  image: "Image",
  button: "Button",
  icon: "Icon",
  shortcode: "Shortcode",
  html: "Custom HTML",
  form: "Form",
  spacer: "Spacer",
};

function originForType(type: BuilderNodeType): BuilderNodeOrigin {
  if (type === "form" || type === "shortcode") return "plugin block";
  return "page content";
}

function nodeLabel(node: BuilderNode, index: number): string {
  const propLabel =
    typeof node.props.label === "string" ? node.props.label.trim() : "";
  if (propLabel) return propLabel;
  return `${TYPE_LABEL[node.type]} ${index + 1}`;
}

export function buildSelectionTree(
  document: BuilderDocument,
): BuilderSelectionTree {
  const nodes: Record<string, BuilderSelectableNode> = {
    [BUILDER_PAGE_NODE_ID]: {
      id: BUILDER_PAGE_NODE_ID,
      kind: "page",
      label: "Page",
      origin: "page content",
      parentId: null,
      children: document.children.map((child) => child.id),
      isContainer: true,
    },
  };

  const walk = (children: BuilderNode[], parentId: string) => {
    children.forEach((node, index) => {
      nodes[node.id] = {
        id: node.id,
        kind: node.type,
        label: nodeLabel(node, index),
        origin: originForType(node.type),
        parentId,
        children: node.children.map((child) => child.id),
        isContainer: BUILDER_CONTAINER_TYPES.has(node.type),
      };
      walk(node.children, node.id);
    });
  };
  walk(document.children, BUILDER_PAGE_NODE_ID);

  return { rootId: BUILDER_PAGE_NODE_ID, nodes };
}

export function resolveSelectedNodeId(
  tree: BuilderSelectionTree,
  requestedId: string | null | undefined,
): string {
  return requestedId && tree.nodes[requestedId] ? requestedId : tree.rootId;
}

export function getBreadcrumb(
  tree: BuilderSelectionTree,
  selectedId: string,
): BuilderSelectableNode[] {
  const selected = tree.nodes[selectedId];
  if (!selected) return [tree.nodes[tree.rootId]];
  const path: BuilderSelectableNode[] = [];
  let current: BuilderSelectableNode | undefined = selected;
  while (current) {
    path.unshift(current);
    current = current.parentId ? tree.nodes[current.parentId] : undefined;
  }
  return path;
}

export function getParentNodeId(
  tree: BuilderSelectionTree,
  selectedId: string,
): string | null {
  return tree.nodes[selectedId]?.parentId ?? null;
}

export function getFirstChildNodeId(
  tree: BuilderSelectionTree,
  selectedId: string,
): string | null {
  return tree.nodes[selectedId]?.children[0] ?? null;
}

export function getNextSiblingNodeId(
  tree: BuilderSelectionTree,
  selectedId: string,
): string | null {
  const node = tree.nodes[selectedId];
  if (!node?.parentId) return null;
  const siblings = tree.nodes[node.parentId]?.children ?? [];
  const index = siblings.indexOf(selectedId);
  return index >= 0 ? (siblings[index + 1] ?? null) : null;
}

export function getPreviousSiblingNodeId(
  tree: BuilderSelectionTree,
  selectedId: string,
): string | null {
  const node = tree.nodes[selectedId];
  if (!node?.parentId) return null;
  const siblings = tree.nodes[node.parentId]?.children ?? [];
  const index = siblings.indexOf(selectedId);
  return index > 0 ? siblings[index - 1] : null;
}
