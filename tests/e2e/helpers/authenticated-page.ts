import type { APIRequestContext, Browser, BrowserContext, Page } from "@playwright/test";

import {
  authCookiesForPlaywright,
  createTestAuthCookies,
} from "./auth-session";

export async function createAuthenticatedPage(
  browser: Browser,
  baseURL: string,
): Promise<{ page: Page; context: BrowserContext }> {
  const { cookies } = await createTestAuthCookies();
  const context = await browser.newContext();
  await context.addCookies(authCookiesForPlaywright(cookies, baseURL));
  const page = await context.newPage();
  return { page, context };
}

export async function assertFitnessTrackerApp(
  request: APIRequestContext,
  baseURL: string,
): Promise<void> {
  const response = await request.get(`${baseURL}/login`);
  const html = await response.text();
  if (!html.includes("Fitness Tracker")) {
    throw new Error(
      `Expected Fitness Tracker at ${baseURL}, but another app is responding. ` +
        "Stop conflicting servers or set PLAYWRIGHT_PORT to a free port.",
    );
  }
}
