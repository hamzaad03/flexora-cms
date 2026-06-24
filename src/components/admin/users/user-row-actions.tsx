"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { Edit, Loader2, Power, Trash2 } from "lucide-react";

import {
  deleteUserAction,
  setUserActiveAction,
} from "@/app/admin/(protected)/users/actions";
import { Button } from "@/components/ui/button";

export function UserRowActions({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const setActive = () => {
    startTransition(async () => {
      const res = await setUserActiveAction(id, !isActive);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to update user.");
        return;
      }
      toast.success(isActive ? "User deactivated." : "User activated.");
    });
  };

  const remove = () => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to delete user.");
        return;
      }
      toast.success("User deleted.");
    });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label="Edit user">
        <Link href={`/admin/users/${id}`}>
          <Edit className="size-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isActive ? "Deactivate user" : "Activate user"}
        disabled={pending}
        onClick={setActive}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Power className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete user"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
