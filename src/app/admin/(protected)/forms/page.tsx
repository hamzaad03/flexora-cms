import Link from "next/link";
import { Plus, Inbox } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { listForms } from "@/server/services/forms";
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

export const metadata = { title: "Forms" };
export const dynamic = "force-dynamic";

export default async function FormsPage() {
  await requirePermission("forms.manage");
  const forms = await listForms();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Forms</h1>
          <p className="text-muted-foreground text-sm">
            Secure forms with honeypot, time-trap, rate-limiting, and optional
            Turnstile.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/forms/new">
            <Plus className="size-4" /> New form
          </Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <p className="text-muted-foreground text-sm">No forms yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Shortcode</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/forms/${f.id}`}
                    className="hover:underline"
                  >
                    {f.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <code className="text-xs">
                    [flxform slug=&quot;{f.slug}&quot;]
                  </code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {f._count.submissions}
                </TableCell>
                <TableCell>
                  {f.isActive ? (
                    <Badge>Active</Badge>
                  ) : (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/forms/${f.id}/submissions`}>
                      <Inbox className="size-4" /> Inbox
                    </Link>
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
