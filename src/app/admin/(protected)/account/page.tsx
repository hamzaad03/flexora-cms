import { requireUser } from "@/server/auth/guard";
import { getCurrentAccount } from "@/server/services/users";
import { AccountForm } from "@/components/admin/users/account-form";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sessionUser = await requireUser();
  const account = await getCurrentAccount(sessionUser.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-muted-foreground text-sm">
          Update your profile and password.
        </p>
      </div>
      <AccountForm
        name={account?.name ?? ""}
        email={account?.email ?? sessionUser.email}
        roles={(account?.roles ?? []).map((r) => r.role.name)}
      />
    </div>
  );
}
