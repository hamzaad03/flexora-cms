"use server";

import { createFirstAdmin, isSetupComplete } from "@/server/services/access";
import { signIn } from "@/server/auth";
import { setupSchema } from "@/lib/validations/auth";
import { logger } from "@/lib/logger";

export type SetupState = { error?: string };

export async function runSetup(
  _prev: SetupState,
  formData: FormData,
): Promise<SetupState> {
  if (await isSetupComplete()) {
    return { error: "Setup has already been completed." };
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // Create the admin inside try/catch; surface DB errors as a message.
  try {
    await createFirstAdmin({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
  } catch (error) {
    logger.error({ err: error }, "Setup failed");
    return { error: "Setup failed. Check the server logs and try again." };
  }

  // Sign in (throws a redirect on success — must propagate, so it's outside
  // the try/catch above).
  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/admin",
  });
  return {};
}
