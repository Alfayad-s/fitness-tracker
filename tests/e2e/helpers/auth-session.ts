import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export type AuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} for E2E auth helper`);
  }
  return value;
}

/** Creates a confirmed test user, signs in, and returns Supabase SSR auth cookies. */
export async function createTestAuthCookies(): Promise<{
  cookies: AuthCookie[];
  email: string;
}> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const email = `e2e-${Date.now()}@fitness-tracker.test`;
  const password = "E2eTestSmokePassword1!";

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) {
    throw createError;
  }

  const cookies: AuthCookie[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookies.map(({ name, value }) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          const index = cookies.findIndex((entry) => entry.name === cookie.name);
          if (index >= 0) {
            cookies[index] = cookie;
          } else {
            cookies.push(cookie);
          }
        }
      },
    },
  });

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !data.user) {
    throw signInError ?? new Error("Sign-in did not return a user");
  }

  return { cookies, email };
}

function normalizeSameSite(
  value: CookieOptions["sameSite"],
): "Strict" | "Lax" | "None" {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "strict") return "Strict";
    if (normalized === "none") return "None";
  }
  return "Lax";
}

export function authCookiesForPlaywright(
  cookies: AuthCookie[],
  baseURL: string,
): Array<{
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}> {
  const { hostname } = new URL(baseURL);

  return cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: hostname,
    path: cookie.options.path ?? "/",
    httpOnly: cookie.options.httpOnly ?? false,
    secure: cookie.options.secure ?? false,
    sameSite: normalizeSameSite(cookie.options.sameSite),
  }));
}

export function hasE2EAuthEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
