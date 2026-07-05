import Link from "next/link";

import { requirePermission } from "@/server/auth/guard";
import { listMenus } from "@/server/services/menu";
import { NewMenuForm } from "./new-menu-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Menus" };
export const dynamic = "force-dynamic";

export default async function MenusPage() {
  await requirePermission("menus.manage");
  const menus = await listMenus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Menus</h1>
        <p className="text-muted-foreground text-sm">
          Build navigation menus with nested items and mega-menus.
        </p>
      </div>

      <NewMenuForm />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menus.map((m) => (
          <Card key={m.id}>
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={`/admin/menus/${m.id}`} className="hover:underline">
                  {m.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              <code>{m.slug}</code> · {m._count.items} items
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
