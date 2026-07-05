import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requirePermission } from "@/server/auth/guard";
import { getForm, listSubmissions } from "@/server/services/forms";
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

export const dynamic = "force-dynamic";

export default async function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("forms.manage");

  const form = await getForm(id);
  if (!form) notFound();
  const submissions = await listSubmissions(id);
  const real = submissions.filter((s) => !s.spam);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/admin/forms/${id}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{form.name} — Submissions</h1>
          <p className="text-muted-foreground text-sm">
            {real.length} received · {submissions.length - real.length} blocked
            as spam
          </p>
        </div>
      </div>

      {real.length === 0 ? (
        <p className="text-muted-foreground text-sm">No submissions yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {real.map((s) => {
              const data = (s.data as Record<string, unknown>) ?? {};
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap align-top">
                    {new Date(s.createdAt).toLocaleString()}
                    {s.spam ? (
                      <Badge variant="outline" className="ml-2">
                        spam
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <dl className="grid gap-1 text-sm">
                      {Object.entries(data).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <dt className="text-muted-foreground min-w-24 font-medium">
                            {k}
                          </dt>
                          <dd className="whitespace-pre-wrap">{String(v)}</dd>
                        </div>
                      ))}
                    </dl>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
