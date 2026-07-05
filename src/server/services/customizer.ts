import "server-only";

import { db } from "@/lib/db";

// Customizer key -> CSS custom property mapping. Keys live in
// `customizer_settings`; the values are injected into the page as :root vars
// so themes can consume them without a rebuild.
const CSS_VAR_MAP: Record<string, string> = {
  "colors.primary": "--primary",
  "colors.secondary": "--secondary",
  "colors.accent": "--accent",
  "colors.text": "--text",
  "colors.background": "--background",
  "fonts.heading": "--font-heading",
  "fonts.body": "--font-body",
};

export async function getCustomizer(): Promise<Record<string, unknown>> {
  const rows = await db.customizerSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setCustomizer(
  values: Record<string, unknown>,
): Promise<void> {
  await db.$transaction(
    Object.entries(values).map(([key, value]) =>
      db.customizerSetting.upsert({
        where: { key },
        update: { value: value as object },
        create: { key, value: value as object },
      }),
    ),
  );
}

/** Build a `:root { ... }` CSS block from customizer values. */
export function buildCustomizerCss(values: Record<string, unknown>): string {
  const decls: string[] = [];
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = values[key];
    if (typeof value === "string" && value.trim()) {
      decls.push(`${cssVar}: ${value};`);
    }
  }
  if (decls.length === 0) return "";
  return `:root{${decls.join("")}}`;
}

export { CSS_VAR_MAP };
