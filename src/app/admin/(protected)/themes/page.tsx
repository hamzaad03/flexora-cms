import { requirePermission } from "@/server/auth/guard";
import { ensureBundledThemes, listThemes } from "@/server/services/theme";
import { ThemeManager, type ThemeView } from "./theme-manager";

export const metadata = { title: "Themes" };
export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  await requirePermission("themes.manage");

  // First run: install + activate the bundled starter theme automatically.
  await ensureBundledThemes();

  const themes = await listThemes();
  const view: ThemeView[] = themes.map((t) => ({
    slug: t.slug,
    name: t.name,
    version: t.version,
    author: t.author,
    isActive: t.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Themes</h1>
        <p className="text-muted-foreground text-sm">
          Upload an HTML/CSS theme, then activate it to serve your site.
        </p>
      </div>
      <ThemeManager themes={view} />
    </div>
  );
}
