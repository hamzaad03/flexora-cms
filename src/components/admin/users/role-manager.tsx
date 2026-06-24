"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  deleteRoleAction,
  saveRoleAction,
} from "@/app/admin/(protected)/users/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type PermissionOption = {
  slug: string;
  name: string;
  group: string;
};

export type RoleRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  users: number;
  permissions: string[];
};

function toggle(items: string[], item: string, checked: boolean) {
  return checked
    ? Array.from(new Set([...items, item]))
    : items.filter((i) => i !== item);
}

export function RoleManager({
  roles,
  permissionGroups,
}: {
  roles: RoleRow[];
  permissionGroups: { group: string; permissions: PermissionOption[] }[];
}) {
  return (
    <div className="space-y-6">
      <RoleEditor permissionGroups={permissionGroups} />
      <div className="grid gap-4">
        {roles.map((role) => (
          <RoleEditor
            key={role.id}
            role={role}
            permissionGroups={permissionGroups}
          />
        ))}
      </div>
    </div>
  );
}

function RoleEditor({
  role,
  permissionGroups,
}: {
  role?: RoleRow;
  permissionGroups: { group: string; permissions: PermissionOption[] }[];
}) {
  const [pending, startTransition] = useTransition();
  const isNew = !role;
  const isLocked = Boolean(role?.isSystem);
  const [name, setName] = useState(role?.name ?? "");
  const [slug, setSlug] = useState(role?.slug ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(
    role?.permissions ?? [],
  );

  const save = () => {
    startTransition(async () => {
      const res = await saveRoleAction(role?.id ?? null, {
        name,
        slug,
        description: description || null,
        permissions,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save role.");
        return;
      }
      toast.success("Role saved.");
    });
  };

  const remove = () => {
    if (!role || !window.confirm("Delete this custom role?")) return;
    startTransition(async () => {
      const res = await deleteRoleAction(role.id);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to delete role.");
        return;
      }
      toast.success("Role deleted.");
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {isNew ? "New role" : role.name}
            {role?.isSystem ? <Badge variant="outline">system</Badge> : null}
            {role ? (
              <Badge variant="secondary">{role.users} users</Badge>
            ) : null}
          </CardTitle>
          {role && !role.isSystem ? (
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={pending}
              onClick={remove}
              aria-label="Delete role"
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${role?.id ?? "new"}-role-name`}>Name</Label>
            <Input
              id={`${role?.id ?? "new"}-role-name`}
              value={name}
              disabled={isLocked}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${role?.id ?? "new"}-role-slug`}>Slug</Label>
            <Input
              id={`${role?.id ?? "new"}-role-slug`}
              value={slug}
              disabled={isLocked || !isNew}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${role?.id ?? "new"}-role-description`}>
            Description
          </Label>
          <Textarea
            id={`${role?.id ?? "new"}-role-description`}
            value={description}
            disabled={isLocked}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {permissionGroups.map((group) => (
            <fieldset key={group.group} className="rounded-md border p-3">
              <legend className="px-1 text-sm font-medium">
                {group.group}
              </legend>
              <div className="mt-2 space-y-2">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.slug}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={permissions.includes(permission.slug)}
                      disabled={isLocked}
                      onChange={(e) =>
                        setPermissions((current) =>
                          toggle(current, permission.slug, e.target.checked),
                        )
                      }
                    />
                    <span>{permission.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {isLocked ? (
          <p className="text-muted-foreground text-xs">
            System roles are managed by the seed/RBAC definitions and are
            read-only here.
          </p>
        ) : (
          <Button
            onClick={save}
            disabled={pending || !name || !slug}
            variant={isNew ? "default" : "outline"}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isNew ? (
              <Plus className="size-4" />
            ) : null}
            {isNew ? "Create role" : "Save role"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
