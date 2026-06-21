import Link from "next/link";
import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Forbidden — FlxOraCMS" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <ShieldX className="text-muted-foreground size-10" />
      <div>
        <h1 className="text-xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground text-sm">
          You don&apos;t have permission to view this page.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/admin">Back to dashboard</Link>
      </Button>
    </div>
  );
}
