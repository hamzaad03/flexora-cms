import { requirePermission } from "@/server/auth/guard";
import { getCustomizer } from "@/server/services/customizer";
import { CustomizerForm } from "./customizer-form";

export const metadata = { title: "Customizer" };
export const dynamic = "force-dynamic";

export default async function CustomizerPage() {
  await requirePermission("customizer.manage");
  const raw = await getCustomizer();
  const values = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : ""]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customizer</h1>
        <p className="text-muted-foreground text-sm">
          Global colors and fonts. Applied to the active theme as CSS variables
          — no rebuild required.
        </p>
      </div>
      <CustomizerForm values={values} />
    </div>
  );
}
