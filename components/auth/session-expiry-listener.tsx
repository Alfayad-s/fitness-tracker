"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { AUTH_ERROR_CODES } from "@/lib/auth/errors";
import { AUTH_ROUTES, isPublicPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";

const SESSION_CHECK_MS = 5 * 60 * 1000;

function redirectToLogin(router: ReturnType<typeof useRouter>, pathname: string) {
  const params = new URLSearchParams({
    error: AUTH_ERROR_CODES.sessionExpired,
    next: pathname,
  });
  router.replace(`${AUTH_ROUTES.login}?${params.toString()}`);
}

/** Detects expired sessions while the user stays on a protected page. */
export function SessionExpiryListener() {
  const router = useRouter();
  const handlingRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const handleExpired = () => {
      const pathname = window.location.pathname;
      if (isPublicPath(pathname) || handlingRef.current) return;

      handlingRef.current = true;
      toast.error("Your session expired. Please sign in again.");
      redirectToLogin(router, pathname);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && !session) {
        handleExpired();
      }
    });

    const interval = window.setInterval(async () => {
      if (isPublicPath(window.location.pathname)) return;

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        handleExpired();
      }
    }, SESSION_CHECK_MS);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
    };
  }, [router]);

  return null;
}
