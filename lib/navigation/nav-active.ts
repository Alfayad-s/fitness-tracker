import type { AppNavItem } from "@/lib/navigation/app-nav";

export function isNavRouteActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveNavIndex(
  pathname: string,
  items: readonly Pick<AppNavItem, "href">[],
): number {
  const index = items.findIndex((item) =>
    isNavRouteActive(pathname, item.href),
  );
  return index >= 0 ? index : 0;
}
