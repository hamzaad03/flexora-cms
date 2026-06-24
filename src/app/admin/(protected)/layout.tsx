import Link from "next/link";

import { requireUser } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { NAV, type NavGroup } from "@/components/admin/nav-items";
import { Sidebar } from "@/components/admin/sidebar";
import { UserMenu } from "@/components/admin/user-menu";
import { hooks, HOOKS } from "@/server/hooks";
import { ensurePluginsLoaded } from "@/server/services/plugins";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Filter nav by the user's permissions (items without a permission are public
  // to any authenticated user). Drop empty groups.
  // Let plugins extend the nav first, then permission-filter the result so
  // plugin-added items also respect the user's permissions.
  await ensurePluginsLoaded();
  const fullNav = await hooks.applyFilters<NavGroup[]>(HOOKS.adminMenu, NAV);

  const groups: NavGroup[] = fullNav
    .map((group) => ({
      heading: group.heading,
      items: group.items.filter(
        (item) =>
          !item.permission ||
          hasPermission(user.roles, user.permissions, item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
  const canManageSettings = hasPermission(
    user.roles,
    user.permissions,
    "settings.manage",
  );

  return (
    <div className="bg-muted/20 grid min-h-svh grid-cols-1 md:grid-cols-[16rem_1fr]">
      <aside className="bg-background hidden min-h-svh border-r md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/admin" className="font-semibold">
            FlxOraCMS
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Sidebar groups={groups} />
        </div>
        <div className="border-t p-3">
          <UserMenu
            name={user.name}
            email={user.email}
            roles={user.roles}
            canManageSettings={canManageSettings}
            variant="sidebar"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="bg-background flex h-14 items-center justify-between border-b px-4">
          <span className="text-muted-foreground text-sm md:hidden">
            FlxOraCMS
          </span>
          <div className="ml-auto">
            <UserMenu
              name={user.name}
              email={user.email}
              roles={user.roles}
              canManageSettings={canManageSettings}
            />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
