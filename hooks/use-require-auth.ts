"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  isMissingOrInvalidSession,
  isTransientSessionFetchError,
} from "@/lib/auth/client-session";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

export type AuthGateStatus = "loading" | "authenticated" | "unauthenticated";

/** Resolves the Supabase session on the client and redirects to login when missing. */
export function useRequireAuth(returnTo?: string): AuthGateStatus {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthGateStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const redirectToLogin = () => {
      setStatus("unauthenticated");
      const next = returnTo ?? pathname;
      const params = new URLSearchParams({ next });
      router.replace(`${AUTH_ROUTES.login}?${params.toString()}`);
    };

    async function resolveSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          setStatus("authenticated");

          void supabase.auth.getUser().then(({ data: { user }, error }) => {
            if (cancelled || user) return;
            if (isTransientSessionFetchError(error)) return;
            if (isMissingOrInvalidSession(user, error)) {
              redirectToLogin();
            }
          });
          return;
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (user) {
          setStatus("authenticated");
          return;
        }

        if (isTransientSessionFetchError(error)) {
          setStatus("loading");
          return;
        }

        if (isMissingOrInvalidSession(user, error)) {
          redirectToLogin();
        }
      } catch (error) {
        if (cancelled) return;

        if (isTransientSessionFetchError(error)) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            setStatus("authenticated");
            return;
          }
          setStatus("loading");
          return;
        }
      }
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [pathname, returnTo, router]);

  return status;
}
