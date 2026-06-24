import { requirePermission } from "@/server/auth/guard";
import { getSettings } from "@/server/services/settings";
import { SettingsForm, type SettingsValues } from "./settings-form";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requirePermission("settings.manage");
  const s = await getSettings();

  const str = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : "");
  const initial: SettingsValues = {
    "identity.title": str("identity.title"),
    "identity.tagline": str("identity.tagline"),
    "identity.logo": str("identity.logo"),
    "identity.favicon": str("identity.favicon"),
    "integrations.ga": str("integrations.ga"),
    "integrations.gsc": str("integrations.gsc"),
    "integrations.clarity": str("integrations.clarity"),
    "analytics.enabled": s["analytics.enabled"] !== false,
    "forms.turnstile.site": str("forms.turnstile.site"),
    "forms.turnstile.secret": str("forms.turnstile.secret"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Site identity, analytics, and third-party integrations.
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
