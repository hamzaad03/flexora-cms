import { redirect } from "next/navigation";

import { SetupForm } from "./setup-form";
import { FlexoraLogo } from "@/components/brand/flexora-logo";
import { isSetupComplete } from "@/server/services/access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Setup" };

// Reads the DB at request time; never prerender at build.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await isSetupComplete()) {
    redirect("/admin/login");
  }

  return (
    <div className="from-accent/60 via-background to-background flex min-h-svh bg-gradient-to-b items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <FlexoraLogo className="mb-2" />
          <CardTitle className="text-xl">Welcome to FlexoraCMS</CardTitle>
          <CardDescription>
            Create your Super Admin account to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
