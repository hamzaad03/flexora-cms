import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getUserForAdmin, listRolesForAdmin } from "@/server/services/users";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/users/user-form";

export const metadata = { title: "Edit User" };
export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await requirePermission("users.manage");
  const { id } = await params;
  const [user, roles] = await Promise.all([
    getUserForAdmin(id),
    listRolesForAdmin(),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/users">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{user.name || user.email}</h1>
          <p className="text-muted-foreground text-sm">
            Edit profile fields, account status, roles, and password.
          </p>
        </div>
      </div>
      <UserForm
        user={{
          id: user.id,
          name: user.name ?? "",
          email: user.email,
          isActive: user.isActive,
          roles: user.roles.map((r) => r.role.slug),
        }}
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
