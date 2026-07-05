import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { listRolesForAdmin } from "@/server/services/users";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/users/user-form";

export const metadata = { title: "New User" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const currentUser = await requirePermission("users.manage");
  const roles = await listRolesForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/users">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New user</h1>
          <p className="text-muted-foreground text-sm">
            Create an account and assign one or more roles.
          </p>
        </div>
      </div>
      <UserForm
        roles={roles.map((role) => ({
          slug: role.slug,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
        }))}
        canAssignSuperAdmin={currentUser.roles.includes("super-admin")}
      />
    </div>
  );
}
