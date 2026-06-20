"use server";

import { signOut } from "./index";

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
