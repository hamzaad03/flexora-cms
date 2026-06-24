import sanitizeHtml from "sanitize-html";

// Allowlist for rich-text content produced by the Tiptap editor. Scripts,
// styles, event handlers, and unknown tags are stripped. Applied server-side
// before persisting any user HTML.
const options: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "ul",
    "ol",
    "li",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "code",
    "pre",
    "a",
    "img",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    span: [],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Force safe rel on links that open a new tab.
  transformTags: {
    a: (tagName, attribs) => {
      const out = { ...attribs };
      if (out.target === "_blank") out.rel = "noopener noreferrer";
      return { tagName, attribs: out };
    },
  },
};

export function sanitizeRichText(dirty: string): string {
  return sanitizeHtml(dirty ?? "", options);
}

// Broader allowlist for "Custom HTML" layout blocks: structural tags + class,
// still no scripts/styles/event handlers.
const blockOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    ...(options.allowedTags as string[]),
    "div",
    "section",
    "header",
    "footer",
    "nav",
    "article",
    "aside",
    "figure",
    "figcaption",
    "small",
    "button",
  ],
  allowedAttributes: {
    "*": ["class", "id", "aria-label", "role"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    button: ["type"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
};

export function sanitizeBlockHtml(dirty: string): string {
  return sanitizeHtml(dirty ?? "", blockOptions);
}
