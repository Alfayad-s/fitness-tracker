import { isHomeRoute } from "@/lib/layout/mobile-header-metrics";

/** Routes that render their own back control (full-screen layouts). */
const CUSTOM_BACK_PATHS = ["/ai"] as const;

export function shouldShowPageBackButton(pathname: string): boolean {
  if (pathname === "/" || isHomeRoute(pathname)) return false;
  return !CUSTOM_BACK_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
