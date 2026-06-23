import { z } from "zod";

// theme.json schema. Themes are folders of HTML/Liquid templates + assets.
export const themeManifestSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be kebab-case (a-z, 0-9, -)"),
  version: z.string().default("1.0.0"),
  author: z.string().optional(),
  description: z.string().optional(),
  screenshot: z.string().optional(),
  // Map of template type -> relative file path within the theme.
  // Recognised types: home, page, post, archive, search, 404.
  templates: z.record(z.string(), z.string()).default({}),
  // Named regions the theme exposes for header/footer/area injection.
  regions: z.array(z.string()).default([]),
  // Supported menu locations (e.g. ["main", "footer"]).
  menus: z.array(z.string()).default([]),
});

export type ThemeManifest = z.infer<typeof themeManifestSchema>;

export function parseManifest(raw: unknown): ThemeManifest {
  return themeManifestSchema.parse(raw);
}
