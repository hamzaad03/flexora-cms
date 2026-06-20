import Link from "next/link";

import { Button } from "@/components/ui/button";

// Placeholder home page. Phase 1 replaces this with the public theme renderer
// at src/app/(site)/[[...slug]]/page.tsx.
export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">FlxOraCMS</h1>
        <p className="text-muted-foreground max-w-md">
          A self-hosted CMS where you upload an HTML/CSS theme and edit content
          without touching code. The public site renderer arrives in Phase 1.
        </p>
      </div>
      <Button asChild>
        <Link href="/admin">Go to dashboard</Link>
      </Button>
    </main>
  );
}
