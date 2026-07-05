"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { createRedirectAction, deleteRedirectAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export type RedirectRow = {
  id: string;
  from: string;
  to: string;
  code: number;
  hits: number;
};

export function RedirectsManager({ rows }: { rows: RedirectRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [code, setCode] = useState("301");

  const add = () =>
    startTransition(async () => {
      const res = await createRedirectAction(from, to, Number(code));
      if (res.ok) {
        toast.success("Redirect added.");
        setFrom("");
        setTo("");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });

  const remove = (id: string) =>
    startTransition(async () => {
      const res = await deleteRedirectAction(id);
      if (res.ok) {
        toast.success("Deleted.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed.");
      }
    });

  return (
    <div className="space-y-4">
      <div className="grid items-end gap-2 rounded-md border p-3 sm:grid-cols-[1fr_1fr_7rem_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="r-from">From path</Label>
          <Input
            id="r-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="/old-page"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-to">To URL</Label>
          <Input
            id="r-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="/new-page"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="r-code">Code</Label>
          <Select value={code} onValueChange={(v) => setCode(v ?? "301")}>
            <SelectTrigger id="r-code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="301">301</SelectItem>
              <SelectItem value="302">302</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={add} disabled={pending || !from || !to}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">No redirects yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Hits</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <code>{r.from}</code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <code>{r.to}</code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{r.code}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.hits}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => remove(r.id)}
                    aria-label="Delete redirect"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
