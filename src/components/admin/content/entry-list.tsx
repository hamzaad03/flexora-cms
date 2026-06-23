"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Pencil, ExternalLink } from "lucide-react";

import { deleteEntryAction } from "@/app/admin/(protected)/content/[type]/actions";
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

export type EntryRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  author: string | null;
  updatedAt: string;
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  SCHEDULED: "outline",
  TRASHED: "outline",
};

export function EntryList({
  typeSlug,
  rows,
  canDelete,
}: {
  typeSlug: string;
  rows: EntryRow[];
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = (id: string) => {
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteEntryAction(id, typeSlug);
      if (res.ok) {
        toast.success("Deleted.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Delete failed.");
      }
    });
  };

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No entries yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">
              <Link
                href={`/admin/content/${typeSlug}/${row.id}`}
                className="hover:underline"
              >
                {row.title}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[row.status] ?? "secondary"}>
                {row.status.toLowerCase()}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {row.author ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(row.updatedAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button asChild variant="ghost" size="icon" aria-label="View">
                  <a href={`/${row.slug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button asChild variant="ghost" size="icon" aria-label="Edit">
                  <Link href={`/admin/content/${typeSlug}/${row.id}`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                {canDelete ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    disabled={pending}
                    onClick={() => remove(row.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
