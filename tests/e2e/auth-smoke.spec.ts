import { expect, test } from "@playwright/test";

import {
  assertFitnessTrackerApp,
  createAuthenticatedPage,
} from "./helpers/authenticated-page";
import { hasE2EAuthEnv } from "./helpers/auth-session";

test.describe("auth smoke", () => {
  test.skip(
    !hasE2EAuthEnv(),
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY",
  );

  test.beforeAll(async ({ request, baseURL }) => {
    await assertFitnessTrackerApp(request, baseURL!);
  });

  test("sign up (email) → dashboard → sign out", async ({ browser, baseURL }) => {
    const { page, context } = await createAuthenticatedPage(browser, baseURL!);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/how your training is going/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.goto("/profile");
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*next=%2Fdashboard)?/);

    await context.close();
  });
});
