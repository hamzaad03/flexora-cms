"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { createMenuAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewMenuForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");

  const create = () =>
    startTransition(async () => {
      const res = await createMenuAction(name);
      if (res.ok && res.id) {
        toast.success("Menu created.");
        router.push(`/admin/menus/${res.id}`);
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });

  return (
    <div className="flex items-end gap-2 rounded-md border p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Menu name (e.g. Main)"
        className="max-w-xs"
      />
      <Button onClick={create} disabled={pending || !name}>
        <Plus className="size-4" /> Create
      </Button>
    </div>
  );
}
