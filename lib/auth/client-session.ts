import type { AuthError } from "@supabase/supabase-js";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

/** Offline, DNS, CORS, or other non-auth fetch failures. */
export function isTransientSessionFetchError(error: unknown): boolean {
  if (!error) return false;

  const normalized = errorMessage(error).toLowerCase();
  return (
    normalized === "failed to fetch" ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed") ||
    normalized.includes("load failed")
  );
}

/** Confirmed missing or invalid auth — not a transient network blip. */
export function isMissingOrInvalidSession(
  user: unknown,
  error: unknown,
): boolean {
  if (user) return false;
  if (isTransientSessionFetchError(error)) return false;

  if (!error) return true;

  if (typeof error === "object" && error !== null) {
    const authError = error as AuthError;
    if (authError.name === "AuthSessionMissingError") return true;
    if (authError.status === 401 || authError.status === 403) return true;
  }

  const normalized = errorMessage(error).toLowerCase();
  return (
    normalized.includes("invalid") ||
    normalized.includes("expired") ||
    normalized.includes("jwt") ||
    normalized.includes("session")
  );
}
