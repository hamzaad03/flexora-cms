import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";
import { FlexoraLogo } from "@/components/brand/flexora-logo";
import { isSetupComplete } from "@/server/services/access";
import { getCurrentUser } from "@/server/auth/guard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Sign in" };

// Reads the DB / session at request time; never prerender at build.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // No users yet → send them to first-run setup.
  if (!(await isSetupComplete())) {
    redirect("/setup");
  }
  // Already signed in → go to dashboard.
  if (await getCurrentUser()) {
    redirect("/admin");
  }

  return (
    <div className="from-accent/60 via-background to-background flex min-h-svh bg-gradient-to-b items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <FlexoraLogo className="mb-2" />
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Need to set up the site?{" "}
            <Link href="/setup" className="underline">
              First-run setup
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
