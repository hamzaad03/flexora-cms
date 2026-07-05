import "server-only";

import { getSettings } from "@/server/services/settings";
import { getFormBySlug } from "@/server/services/forms";
import {
  HONEYPOT_FIELD,
  TIMESTAMP_FIELD,
  type FormField,
  type FormSettings,
} from "@/lib/forms";
import type { Form } from "@prisma/client";

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderField(field: FormField): string {
  if (field.type === "hidden") {
    return `<input type="hidden" name="${esc(field.name)}" value="" />`;
  }
  const id = `flxf_${esc(field.name)}`;
  const req = field.required ? " required" : "";
  const reqMark = field.required ? ' <span class="flx-form__req">*</span>' : "";
  let control = "";

  switch (field.type) {
    case "textarea":
      control = `<textarea id="${id}" name="${esc(field.name)}" placeholder="${esc(field.placeholder ?? "")}"${req} rows="5"></textarea>`;
      break;
    case "select":
      control = `<select id="${id}" name="${esc(field.name)}"${req}><option value="">Choose…</option>${(
        field.options ?? []
      )
        .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
        .join("")}</select>`;
      break;
    case "radio":
      control = `<div class="flx-form__radios">${(field.options ?? [])
        .map(
          (o, i) =>
            `<label class="flx-form__radio"><input type="radio" name="${esc(field.name)}" value="${esc(o)}"${i === 0 && field.required ? " required" : ""} /> ${esc(o)}</label>`,
        )
        .join("")}</div>`;
      break;
    case "checkbox":
    case "consent":
      return `<div class="flx-form__field flx-form__field--full flx-form__field--check">
        <label><input type="checkbox" id="${id}" name="${esc(field.name)}" value="yes"${req} /> ${esc(field.label)}${reqMark}</label>
        <span class="flx-form__error" data-for="${esc(field.name)}"></span>
      </div>`;
    default:
      control = `<input type="${esc(field.type)}" id="${id}" name="${esc(field.name)}" placeholder="${esc(field.placeholder ?? "")}"${req} />`;
  }

  return `<div class="flx-form__field flx-form__field--${field.width ?? "full"}">
    <label for="${id}">${esc(field.label)}${reqMark}</label>
    ${control}
    <span class="flx-form__error" data-for="${esc(field.name)}"></span>
  </div>`;
}

/** Render a form to HTML. Returns { html, needsCaptcha }. */
export async function renderForm(
  form: Form,
): Promise<{ html: string; needsCaptcha: boolean }> {
  const fields = (form.fields as FormField[]) ?? [];
  const settings = (form.settings as FormSettings) ?? {};
  const global = await getSettings();
  const siteKey = global["forms.turnstile.site"];
  const needsCaptcha = Boolean(
    settings.requireCaptcha && typeof siteKey === "string" && siteKey,
  );

  const captchaHtml = needsCaptcha
    ? `<div class="cf-turnstile" data-sitekey="${esc(siteKey)}"></div>`
    : "";

  const html = `<form class="flx-form" data-flxform="${esc(form.slug)}" action="/api/forms/${esc(form.slug)}" method="post" novalidate>
    <div class="flx-form__hp" aria-hidden="true">
      <label>Leave this empty<input type="text" name="${HONEYPOT_FIELD}" tabindex="-1" autocomplete="off" /></label>
    </div>
    <input type="hidden" name="${TIMESTAMP_FIELD}" value="${Date.now()}" />
    <div class="flx-form__grid">${fields.map(renderField).join("")}</div>
    ${captchaHtml}
    <div class="flx-form__status" role="status" aria-live="polite"></div>
    <button type="submit" class="flx-form__submit">${esc(settings.submitLabel || "Submit")}</button>
  </form>`;

  return { html, needsCaptcha };
}

const SHORTCODE_RE =
  /(?:<p>\s*)?\[flxform\s+slug="([a-z0-9-]+)"\]\s*(?:<\/p>)?/gi;

/**
 * Replace [flxform slug="…"] shortcodes anywhere in the page HTML with rendered
 * forms, and inject the form assets (CSS + JS, plus Turnstile when needed).
 */
export async function renderFormsInHtml(html: string): Promise<string> {
  if (!html.includes("[flxform")) return html;

  const slugs = new Set<string>();
  for (const m of html.matchAll(SHORTCODE_RE)) slugs.add(m[1]);
  if (slugs.size === 0) return html;

  const rendered = new Map<string, string>();
  let anyCaptcha = false;
  for (const slug of slugs) {
    const form = await getFormBySlug(slug);
    if (!form || !form.isActive) {
      rendered.set(slug, "");
      continue;
    }
    const r = await renderForm(form);
    rendered.set(slug, r.html);
    if (r.needsCaptcha) anyCaptcha = true;
  }

  let out = html.replace(
    SHORTCODE_RE,
    (_m, slug: string) => rendered.get(slug) ?? "",
  );

  const cssLink = '<link rel="stylesheet" href="/flx-forms.css" />';
  if (!out.includes("/flx-forms.css")) {
    out = out.includes("</head>")
      ? out.replace("</head>", `${cssLink}</head>`)
      : cssLink + out;
  }

  let scripts = '<script src="/flx-forms.js" defer></script>';
  if (anyCaptcha) {
    scripts =
      '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' +
      scripts;
  }
  if (!out.includes("/flx-forms.js")) {
    out = out.includes("</body>")
      ? out.replace("</body>", `${scripts}</body>`)
      : out + scripts;
  }

  return out;
}
