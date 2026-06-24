import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import {
  listPermissionsForAdmin,
  listRolesForAdmin,
} from "@/server/services/users";
import { Button } from "@/components/ui/button";
import { RoleManager } from "@/components/admin/users/role-manager";

export const metadata = { title: "User Roles" };
export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requirePermission("users.manage");
  const [roles, permissionGroups] = await Promise.all([
    listRolesForAdmin(),
    listPermissionsForAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/users">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Roles</h1>
          <p className="text-muted-foreground text-sm">
            View system roles and create custom capability sets.
          </p>
        </div>
      </div>
      <RoleManager
        roles={roles.map((role) => ({
          id: role.id,
          slug: role.slug,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          users: role._count.users,
          permissions: role.permissions.map((p) => p.permission.slug),
        }))}
        permissionGroups={Object.entries(permissionGroups).map(
          ([group, permissions]) => ({
            group,
            permissions: permissions.map((permission) => ({
              slug: permission.slug,
              name: permission.name,
              group: permission.group ?? "Other",
            })),
          }),
        )}
      />
    </div>
  );
}
