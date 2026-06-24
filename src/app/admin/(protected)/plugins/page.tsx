import { requirePermission } from "@/server/auth/guard";
import { listPluginsForAdmin } from "@/server/services/plugins";
import { PluginList, type PluginRow } from "./plugin-list";

export const metadata = { title: "Plugins" };
export const dynamic = "force-dynamic";

export default async function PluginsPage() {
  await requirePermission("plugins.manage");
  const plugins = await listPluginsForAdmin();
  const rows: PluginRow[] = plugins.map((p) => ({
    slug: p.slug,
    name: p.name,
    version: p.version,
    description: p.description,
    author: p.author,
    isEnabled: p.isEnabled,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Plugins</h1>
        <p className="text-muted-foreground text-sm">
          Enable or disable plugins. Plugins extend FlxOraCMS via hooks.
        </p>
      </div>
      <PluginList plugins={rows} />
    </div>
  );
}
