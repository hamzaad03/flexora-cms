import "server-only";

import { sanitizeBlockHtml } from "@/lib/sanitize";
import type { ResolvedMenuItem } from "@/server/services/menu";

export type LayoutRenderCtx = {
  site: { title: string; tagline: string; url: string; logo: string | null };
  menus: Record<string, ResolvedMenuItem[]>;
};

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const str = (props: Record<string, unknown>, key: string, fallback = "") =>
  typeof props[key] === "string" ? (props[key] as string) : fallback;

// Component picker metadata for the builder UI.
export const COMPONENT_TYPES: { type: string; label: string; icon: string }[] =
  [
    { type: "logo", label: "Logo", icon: "image" },
    { type: "menu", label: "Menu", icon: "menu" },
    { type: "button", label: "Button", icon: "square" },
    { type: "search", label: "Search", icon: "search" },
    { type: "social", label: "Social", icon: "share-2" },
    { type: "language", label: "Language", icon: "languages" },
    { type: "phone", label: "Phone", icon: "phone" },
    { type: "email", label: "Email", icon: "mail" },
    { type: "cart", label: "Cart", icon: "shopping-cart" },
    { type: "login", label: "Login", icon: "log-in" },
    { type: "form", label: "Form", icon: "inbox" },
    { type: "html", label: "Custom HTML", icon: "code" },
  ];

function renderMenuItems(items: ResolvedMenuItem[]): string {
  if (items.length === 0) return "";
  const li = items
    .map((item) => {
      const mega = Boolean(item.config?.mega);
      const sub =
        item.children.length > 0
          ? `<ul class="flx-submenu${mega ? " flx-submenu--mega" : ""}">${renderMenuItems(
              item.children,
            )}</ul>`
          : "";
      return `<li class="flx-menu__item${item.children.length ? " has-children" : ""}"><a href="${esc(
        item.url,
      )}" target="${esc(item.target)}">${esc(item.label)}</a>${sub}</li>`;
    })
    .join("");
  return li;
}

type ComponentRenderer = (
  props: Record<string, unknown>,
  ctx: LayoutRenderCtx,
) => string;

const COMPONENTS: Record<string, ComponentRenderer> = {
  logo(props, ctx) {
    const text = str(props, "text") || ctx.site.title;
    const inner = ctx.site.logo
      ? `<img class="flx-logo__img" src="${esc(ctx.site.logo)}" alt="${esc(text)}" />`
      : esc(text);
    return `<a class="flx-logo" href="/">${inner}</a>`;
  },

  menu(props, ctx) {
    const slug = str(props, "menu", "main");
    const items = ctx.menus[slug] ?? [];
    return `<nav class="flx-menu" aria-label="${esc(slug)}"><ul class="flx-menu__list">${renderMenuItems(
      items,
    )}</ul></nav>`;
  },

  button(props) {
    const label = str(props, "label", "Button");
    const url = str(props, "url", "#");
    const variant = str(props, "variant", "primary");
    const target = str(props, "target", "_self");
    return `<a class="flx-btn flx-btn--${esc(variant)}" href="${esc(url)}" target="${esc(
      target,
    )}">${esc(label)}</a>`;
  },

  search(props) {
    const action = str(props, "action", "/search");
    const placeholder = str(props, "placeholder", "Search…");
    return `<form class="flx-search" action="${esc(action)}" method="get" role="search">
      <input class="flx-search__input" type="search" name="q" placeholder="${esc(
        placeholder,
      )}" aria-label="Search" />
    </form>`;
  },

  social(props) {
    const links = Array.isArray(props.links)
      ? (props.links as { network?: string; url?: string }[])
      : [];
    const items = links
      .filter((l) => l.url)
      .map(
        (l) =>
          `<a class="flx-social__link" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(
            l.network ?? "social",
          )}">${esc(l.network ?? "")}</a>`,
      )
      .join("");
    return `<div class="flx-social">${items}</div>`;
  },

  language(props) {
    const langs = Array.isArray(props.languages)
      ? (props.languages as { label?: string; url?: string }[])
      : [];
    const items = langs
      .map(
        (l) =>
          `<a class="flx-lang__link" href="${esc(l.url ?? "#")}">${esc(l.label ?? "")}</a>`,
      )
      .join("");
    return `<div class="flx-lang">${items}</div>`;
  },

  phone(props) {
    const number = str(props, "number");
    if (!number) return "";
    return `<a class="flx-phone" href="tel:${esc(number.replace(/[^+\d]/g, ""))}">${esc(
      str(props, "label") || number,
    )}</a>`;
  },

  email(props) {
    const email = str(props, "email");
    if (!email) return "";
    return `<a class="flx-email" href="mailto:${esc(email)}">${esc(
      str(props, "label") || email,
    )}</a>`;
  },

  cart(props) {
    const url = str(props, "url", "/cart");
    return `<a class="flx-cart" href="${esc(url)}" aria-label="Cart">${esc(
      str(props, "label", "Cart"),
    )}</a>`;
  },

  login(props) {
    const url = str(props, "url", "/admin/login");
    return `<a class="flx-login" href="${esc(url)}">${esc(
      str(props, "label", "Login"),
    )}</a>`;
  },

  html(props) {
    return `<div class="flx-html">${sanitizeBlockHtml(str(props, "html"))}</div>`;
  },

  // Emits a shortcode that the form-builder plugin renders into a real form.
  form(props) {
    const slug = str(props, "slug");
    return slug ? `[flxform slug="${esc(slug)}"]` : "";
  },
};

export function renderComponent(
  type: string,
  props: Record<string, unknown>,
  ctx: LayoutRenderCtx,
): string {
  const renderer = COMPONENTS[type];
  return renderer ? renderer(props ?? {}, ctx) : "";
}
