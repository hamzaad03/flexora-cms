// Client-safe component metadata for the layout builder's property editor.
// (The server-only registry in src/server/layout/registry.ts does the actual
// HTML rendering.)

export type FieldKind = "text" | "textarea" | "select" | "json";

export type ComponentField = {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  placeholder?: string;
};

export type ComponentDef = {
  type: string;
  label: string;
  icon: string;
  fields: ComponentField[];
};

export const COMPONENT_DEFS: ComponentDef[] = [
  {
    type: "logo",
    label: "Logo",
    icon: "image",
    fields: [{ key: "text", label: "Text override", kind: "text" }],
  },
  {
    type: "menu",
    label: "Menu",
    icon: "menu",
    fields: [
      { key: "menu", label: "Menu slug", kind: "text", placeholder: "main" },
    ],
  },
  {
    type: "button",
    label: "Button",
    icon: "square",
    fields: [
      { key: "label", label: "Label", kind: "text" },
      { key: "url", label: "URL", kind: "text" },
      {
        key: "variant",
        label: "Variant",
        kind: "select",
        options: ["primary", "secondary", "outline"],
      },
      {
        key: "target",
        label: "Target",
        kind: "select",
        options: ["_self", "_blank"],
      },
    ],
  },
  {
    type: "search",
    label: "Search",
    icon: "search",
    fields: [
      {
        key: "action",
        label: "Action URL",
        kind: "text",
        placeholder: "/search",
      },
      { key: "placeholder", label: "Placeholder", kind: "text" },
    ],
  },
  {
    type: "social",
    label: "Social",
    icon: "share-2",
    fields: [
      {
        key: "links",
        label: "Links (JSON)",
        kind: "json",
        placeholder: '[{"network":"Twitter","url":"https://…"}]',
      },
    ],
  },
  {
    type: "language",
    label: "Language",
    icon: "languages",
    fields: [
      {
        key: "languages",
        label: "Languages (JSON)",
        kind: "json",
        placeholder: '[{"label":"EN","url":"/"}]',
      },
    ],
  },
  {
    type: "phone",
    label: "Phone",
    icon: "phone",
    fields: [
      { key: "number", label: "Number", kind: "text" },
      { key: "label", label: "Label", kind: "text" },
    ],
  },
  {
    type: "email",
    label: "Email",
    icon: "mail",
    fields: [
      { key: "email", label: "Email", kind: "text" },
      { key: "label", label: "Label", kind: "text" },
    ],
  },
  {
    type: "cart",
    label: "Cart",
    icon: "shopping-cart",
    fields: [
      { key: "url", label: "URL", kind: "text", placeholder: "/cart" },
      { key: "label", label: "Label", kind: "text" },
    ],
  },
  {
    type: "login",
    label: "Login",
    icon: "log-in",
    fields: [
      { key: "url", label: "URL", kind: "text" },
      { key: "label", label: "Label", kind: "text" },
    ],
  },
  {
    type: "form",
    label: "Form",
    icon: "inbox",
    fields: [
      { key: "slug", label: "Form slug", kind: "text", placeholder: "contact" },
    ],
  },
  {
    type: "html",
    label: "Custom HTML",
    icon: "code",
    fields: [{ key: "html", label: "HTML", kind: "textarea" }],
  },
];

export const COMPONENT_DEF_MAP: Record<string, ComponentDef> =
  Object.fromEntries(COMPONENT_DEFS.map((d) => [d.type, d]));
