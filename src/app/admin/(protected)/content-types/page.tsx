import Link from "next/link";
import { Plus } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { listContentTypes } from "@/server/services/content-type";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Content Types" };
export const dynamic = "force-dynamic";

export default async function ContentTypesPage() {
  await requirePermission("content_types.manage");
  const types = await listContentTypes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content Types</h1>
          <p className="text-muted-foreground text-sm">
            Define collections like Pages, Posts, Services, FAQs…
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content-types/new">
            <Plus className="size-4" /> New type
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Entries</TableHead>
            <TableHead>Fields</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {types.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/admin/content-types/${t.id}`}
                  className="hover:underline"
                >
                  {t.label}
                </Link>
                {t.isSystem ? (
                  <Badge variant="outline" className="ml-2">
                    system
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <code>{t.slug}</code>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t._count.entries}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {t._count.fields}
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/content/${t.slug}`}>View entries</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
