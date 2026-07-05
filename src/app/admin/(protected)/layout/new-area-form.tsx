"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { LayoutAreaType } from "@prisma/client";

import { createAreaAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function NewAreaForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<LayoutAreaType>("HEADER");

  const create = () =>
    startTransition(async () => {
      const res = await createAreaAction(type, name);
      if (res.ok && res.id) {
        toast.success("Created.");
        router.push(`/admin/layout/${res.id}`);
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Area name (e.g. Main Header)"
        className="max-w-xs"
      />
      <Select
        value={type}
        onValueChange={(v) => setType((v ?? "HEADER") as LayoutAreaType)}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="HEADER">Header</SelectItem>
          <SelectItem value="FOOTER">Footer</SelectItem>
          <SelectItem value="AREA">Theme area</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={create} disabled={pending || !name}>
        <Plus className="size-4" /> Create
      </Button>
    </div>
  );
}
