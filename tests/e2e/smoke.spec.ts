import { test, expect } from "@playwright/test";

// Smoke test: the public home page renders. Expanded in later phases to cover
// setup → login → content → theme render flows from PLAN.md "Verification".
test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "FlxOraCMS" })).toBeVisible();
});

test("unauthenticated admin redirects to login or setup", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/(admin\/login|setup)/);
});
