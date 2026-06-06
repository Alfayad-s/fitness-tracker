"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { AUTH_ERROR_CODES, getAuthErrorMessage } from "@/lib/auth/errors";

/** Shows a toast when redirected to login after session expiry. */
export function LoginSessionToast() {
  const searchParams = useSearchParams();
  const shownRef = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error !== AUTH_ERROR_CODES.sessionExpired || shownRef.current) return;

    const message = getAuthErrorMessage(error);
    if (message) {
      shownRef.current = true;
      toast.error(message);
    }
  }, [searchParams]);

  return null;
}
