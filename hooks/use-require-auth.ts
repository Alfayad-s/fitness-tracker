"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (cancelled) return;

      if (error || !user) {
        setStatus("unauthenticated");
        const next = returnTo ?? pathname;
        const params = new URLSearchParams({ next });
        router.replace(`${AUTH_ROUTES.login}?${params.toString()}`);
        return;
      }

      setStatus("authenticated");
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, returnTo, router]);

  return status;
}
