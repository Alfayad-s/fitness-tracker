import type { Provider } from "@supabase/supabase-js";

import { buildAuthCallbackUrl } from "@/lib/auth/callback-url";
import { getClientSiteOrigin } from "@/lib/auth/site-origin";
import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google" | "apple";

const OAUTH_PROVIDERS: Record<OAuthProvider, Provider> = {
  google: "google",
  apple: "apple",
};

export async function signInWithOAuthProvider(
  provider: OAuthProvider,
  next?: string,
): Promise<void> {
  const supabase = createClient();
  const redirectTo = buildAuthCallbackUrl(getClientSiteOrigin(), next);

  const options =
    provider === "google"
      ? {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        }
      : {
          redirectTo,
          scopes: "email name",
        };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: OAUTH_PROVIDERS[provider],
    options,
  });

  if (error) {
    throw error;
  }

  if (data.url) {
    window.location.assign(data.url);
  }
}
