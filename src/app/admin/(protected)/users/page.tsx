import Link from "next/link";
import { Plus, Shield } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { hasPermission } from "@/lib/rbac";
import { listRolesForAdmin, listUsers } from "@/server/services/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRowActions } from "@/components/admin/users/user-row-actions";

export const metadata = { title: "Users" };
export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const currentUser = await requirePermission("users.view");
  const sp = await searchParams;
  const q = one(sp.q) ?? "";
  const role = one(sp.role) ?? "all";
  const status = (one(sp.status) ?? "all") as "active" | "inactive" | "all";
  const page = Math.max(1, Number(one(sp.page) ?? "1") || 1);
  const take = 20;
  const [users, roles] = await Promise.all([
    listUsers({ q, role, status, take, skip: (page - 1) * take }),
    listRolesForAdmin(),
  ]);
  const canManage = hasPermission(
    currentUser.roles,
    currentUser.permissions,
    "users.manage",
  );
  const totalPages = Math.max(1, Math.ceil(users.total / take));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-muted-foreground text-sm">
            Manage accounts, roles, and publishing access.
          </p>
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/admin/users/roles">
                <Shield className="size-4" />
                Roles
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/users/new">
                <Plus className="size-4" />
                New user
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <form className="grid gap-3 md:grid-cols-[1fr_12rem_12rem_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search users"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <select
          name="role"
          defaultValue={role}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">All roles</option>
          {roles.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Created</TableHead>
            {canManage ? <TableHead /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.items.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">
                  {canManage ? (
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="hover:underline"
                    >
                      {user.name || user.email}
                    </Link>
                  ) : (
                    user.name || user.email
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.map((r) => (
                    <Badge key={r.role.slug} variant="outline">
                      {r.role.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? "secondary" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user._count.authoredEntries}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {user.createdAt.toISOString().slice(0, 10)}
              </TableCell>
              {canManage ? (
                <TableCell>
                  <UserRowActions id={user.id} isActive={user.isActive} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {users.total} users, page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link
              href={`/admin/users?q=${encodeURIComponent(q)}&role=${role}&status=${status}&page=${page - 1}`}
            >
              Previous
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
          >
            <Link
              href={`/admin/users?q=${encodeURIComponent(q)}&role=${role}&status=${status}&page=${page + 1}`}
            >
              Next
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
