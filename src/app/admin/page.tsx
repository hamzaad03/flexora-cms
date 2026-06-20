import { FileText, Newspaper, Users, Image as ImageIcon } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/server/auth/guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard — FlxOraCMS" };

async function getStats() {
  // Counts are best-effort; if the DB is unavailable, render zeros.
  try {
    const [pages, posts, users, media] = await Promise.all([
      db.contentEntry.count({
        where: { contentType: { slug: "page" } },
      }),
      db.contentEntry.count({
        where: { contentType: { slug: "post" } },
      }),
      db.user.count(),
      db.media.count(),
    ]);
    return { pages, posts, users, media };
  } catch {
    return { pages: 0, posts: 0, users: 0, media: 0 };
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const stats = await getStats();

  const cards = [
    { label: "Pages", value: stats.pages, icon: FileText },
    { label: "Posts", value: stats.posts, icon: Newspaper },
    { label: "Users", value: stats.users, icon: Users },
    { label: "Media", value: stats.media, icon: ImageIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {label}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
