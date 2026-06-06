import { expect, test } from "@playwright/test";

import {
  assertFitnessTrackerApp,
  createAuthenticatedPage,
} from "./helpers/authenticated-page";
import { hasE2EAuthEnv } from "./helpers/auth-session";

test.describe("workout smoke", () => {
  test.skip(
    !hasE2EAuthEnv(),
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY",
  );

  test.beforeAll(async ({ request, baseURL }) => {
    await assertFitnessTrackerApp(request, baseURL!);
  });

  test("auth → start workout → add exercise → save", async ({
    browser,
    baseURL,
  }) => {
    const { page, context } = await createAuthenticatedPage(browser, baseURL!);

    await page.goto("/workouts/new");
    await expect(
      page.getByRole("heading", { name: "New workout" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Start workout" }).click();
    await expect(page).toHaveURL(/\/workouts\/active$/);

    await page.getByRole("button", { name: "Add exercise" }).click();
    await expect(
      page.getByRole("heading", { name: "Add exercise" }),
    ).toBeVisible();

    const exerciseButton = page
      .locator("ul li button")
      .filter({ hasNotText: "Added" })
      .first();
    await expect(exerciseButton).toBeVisible({ timeout: 15_000 });
    await exerciseButton.click();

    await page.getByLabel("Set 1 weight kg").fill("60");
    await page.getByLabel("Set 1 reps").fill("8");

    await page.getByRole("button", { name: "Finish workout" }).click();
    await expect(
      page.getByRole("heading", { name: "Finish workout" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Good" }).click();
    await page.getByRole("button", { name: "Save workout" }).click();

    await expect(page).toHaveURL(/\/workouts(?:\/[0-9a-f-]+)?$/, {
      timeout: 30_000,
    });

    await context.close();
  });
});
