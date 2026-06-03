import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { AUTH_ERROR_CODES } from "@/lib/auth/errors";
import { sanitizeNextPath } from "@/lib/auth/routes";
import { getServerSiteOrigin } from "@/lib/auth/site-origin";
import { syncUserFromAuth } from "@/lib/auth/sync-user";

export async function GET(request: Request) {
  const siteOrigin = getServerSiteOrigin(request);
  const { searchParams } = new URL(request.url);

  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  if (oauthError) {
    const code =
      oauthError === "access_denied"
        ? AUTH_ERROR_CODES.oauthDenied
        : AUTH_ERROR_CODES.oauthFailed;

    const loginUrl = new URL("/login", siteOrigin);
    loginUrl.searchParams.set("error", code);
    if (oauthErrorDescription) {
      loginUrl.searchParams.set("error_description", oauthErrorDescription);
    }
    return NextResponse.redirect(loginUrl);
  }

  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      `${siteOrigin}/login?error=${AUTH_ERROR_CODES.callbackFailed}`,
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] exchangeCodeForSession:", error?.message);
    return NextResponse.redirect(
      `${siteOrigin}/login?error=${AUTH_ERROR_CODES.callbackFailed}`,
    );
  }

  if (!data.user.email) {
    return NextResponse.redirect(
      `${siteOrigin}/login?error=${AUTH_ERROR_CODES.missingEmail}`,
    );
  }

  try {
    await syncUserFromAuth(data.user);
  } catch (syncError) {
    console.error("[auth/callback] syncUserFromAuth:", syncError);
    return NextResponse.redirect(
      `${siteOrigin}/login?error=${AUTH_ERROR_CODES.callbackFailed}`,
    );
  }

  return NextResponse.redirect(`${siteOrigin}${next}`);
}
