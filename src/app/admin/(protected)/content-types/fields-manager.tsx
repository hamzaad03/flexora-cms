"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { addFieldAction, deleteFieldAction } from "./actions";
import { FIELD_TYPES } from "@/lib/validations/content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type FieldRow = {
  id: string;
  name: string;
  label: string;
  type: string;
};

export function FieldsManager({
  contentTypeId,
  fields,
}: {
  contentTypeId: string;
  fields: FieldRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<string>("text");
  const [options, setOptions] = useState("");

  const add = () => {
    const payload = {
      name,
      label,
      type,
      config:
        type === "select"
          ? {
              options: options
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {},
    };
    startTransition(async () => {
      const res = await addFieldAction(contentTypeId, payload);
      if (!res.ok) {
        toast.error(res.error ?? "Failed to add field.");
        return;
      }
      toast.success("Field added.");
      setName("");
      setLabel("");
      setOptions("");
      setType("text");
      router.refresh();
    });
  };

  const remove = (fieldId: string) => {
    startTransition(async () => {
      const res = await deleteFieldAction(contentTypeId, fieldId);
      if (res.ok) {
        toast.success("Field removed.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {fields.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.label}</TableCell>
                <TableCell className="text-muted-foreground">
                  <code>{f.name}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f.type}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => remove(f.id)}
                    aria-label="Delete field"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-sm">No custom fields yet.</p>
      )}

      <div className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_1fr_10rem_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="f-label">Label</Label>
          <Input
            id="f-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Subtitle"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-name">Name</Label>
          <Input
            id="f-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="subtitle"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? "text")}>
            <SelectTrigger id="f-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={add} disabled={pending || !name || !label}>
          <Plus className="size-4" /> Add
        </Button>
        {type === "select" ? (
          <div className="space-y-1.5 sm:col-span-4">
            <Label htmlFor="f-options">Options (comma-separated)</Label>
            <Input
              id="f-options"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Small, Medium, Large"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
