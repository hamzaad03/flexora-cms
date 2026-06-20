import { redirect } from "next/navigation";

import { SetupForm } from "./setup-form";
import { isSetupComplete } from "@/server/services/access";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Setup — FlxOraCMS" };

// Reads the DB at request time; never prerender at build.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await isSetupComplete()) {
    redirect("/admin/login");
  }

  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Welcome to FlxOraCMS</CardTitle>
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
