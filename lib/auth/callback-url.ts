import { sanitizeNextPath } from "@/lib/auth/routes";

export function buildAuthCallbackUrl(
  origin: string,
  next?: string | null,
): string {
  const safeNext = sanitizeNextPath(next);
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNext);
  return url.toString();
}
