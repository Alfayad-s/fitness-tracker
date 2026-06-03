export const AUTH_ROUTES = {
  login: "/login",
  callback: "/auth/callback",
  defaultAuthenticated: "/dashboard",
} as const;

/** Paths reachable without a session */
export const PUBLIC_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.callback,
] as const;

/** Auth screens — signed-in users are redirected away */
export const AUTH_ENTRY_PATHS = [AUTH_ROUTES.login] as const;

/** Legacy routes redirected to login */
export const DEPRECATED_AUTH_PATHS = [
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAuthEntryPath(pathname: string): boolean {
  return AUTH_ENTRY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isDeprecatedAuthPath(pathname: string): boolean {
  return DEPRECATED_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Prevent open redirects via the `next` query param */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return AUTH_ROUTES.defaultAuthenticated;
  }

  if (
    isPublicPath(next) ||
    isAuthEntryPath(next) ||
    isDeprecatedAuthPath(next)
  ) {
    return AUTH_ROUTES.defaultAuthenticated;
  }

  return next;
}
