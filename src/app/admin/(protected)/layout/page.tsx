import Link from "next/link";

import { requirePermission } from "@/server/auth/guard";
import { listAreas } from "@/server/services/layout";
import { NewAreaForm } from "./new-area-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Headers & Footers" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  HEADER: "Headers",
  FOOTER: "Footers",
  AREA: "Theme Areas",
};

export default async function LayoutPage() {
  await requirePermission("layout.manage");
  const areas = await listAreas();

  const grouped = areas.reduce<Record<string, typeof areas>>((acc, a) => {
    (acc[a.type] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Headers & Footers</h1>
        <p className="text-muted-foreground text-sm">
          Build headers, footers, and theme areas, then assign where they apply.
        </p>
      </div>

      <NewAreaForm />

      {(["HEADER", "FOOTER", "AREA"] as const).map((type) => (
        <section key={type} className="space-y-3">
          <h2 className="text-sm font-medium">{TYPE_LABEL[type]}</h2>
          {(grouped[type] ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">None yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(grouped[type] ?? []).map((a) => (
                <Card key={a.id}>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">
                      <Link
                        href={`/admin/layout/${a.id}`}
                        className="hover:underline"
                      >
                        {a.name}
                      </Link>
                    </CardTitle>
                    <div className="flex gap-1">
                      {a.isDefault ? <Badge>Default</Badge> : null}
                      {!a.status ? (
                        <Badge variant="outline">Disabled</Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="text-muted-foreground text-sm">
                    <Link
                      href={`/admin/layout/${a.id}`}
                      className="hover:underline"
                    >
                      Edit builder →
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
