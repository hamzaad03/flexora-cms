"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { History } from "lucide-react";

import { restoreRevisionAction } from "@/app/admin/(protected)/content/[type]/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RevisionRow = {
  id: string;
  createdAt: string;
  author: string | null;
};

export function RevisionsPanel({
  typeSlug,
  entryId,
  revisions,
}: {
  typeSlug: string;
  entryId: string;
  revisions: RevisionRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const restore = (revisionId: string) => {
    if (!confirm("Restore this revision? Current state is saved first."))
      return;
    startTransition(async () => {
      const res = await restoreRevisionAction(revisionId, typeSlug, entryId);
      if (res.ok) {
        toast.success("Revision restored.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Restore failed.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4" /> Revisions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {revisions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No revisions yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {revisions.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.author ? ` · ${r.author}` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => restore(r.id)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
