import type { Animation } from "@/lib/animation";

// The `content_json` shape for headers/footers/theme areas: rows → columns →
// components. Each row/component can carry an animation.

export type LayoutComponent = {
  id: string;
  type: string; // registry key: logo, menu, button, search, social, …
  props: Record<string, unknown>;
  animation?: Animation;
};

export type LayoutColumn = {
  id: string;
  components: LayoutComponent[];
};

export type LayoutRow = {
  id: string;
  columns: LayoutColumn[];
  animation?: Animation;
  settings?: Record<string, unknown>;
};

export type LayoutContent = {
  rows: LayoutRow[];
};

export type AreaSettings = {
  sticky?: boolean;
  transparent?: boolean;
  blur?: boolean;
  scroll?: "none" | "hide-on-down" | "smart";
  maxWidth?: string; // container width, e.g. "64rem" or "100%"
};

export const EMPTY_LAYOUT: LayoutContent = { rows: [] };

export function newId(prefix = "el"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
