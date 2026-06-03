"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_MENU_ICONS } from "@/components/layout/nav-menu-icon";
import { APP_NAV_ITEMS } from "@/lib/navigation/app-nav";
import { isNavRouteActive } from "@/lib/navigation/nav-active";
import { getNavItemClassName } from "@/lib/navigation/nav-styles";
import { cn } from "@/lib/utils";

export function DesktopSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-[100dvh] w-56 shrink-0 flex-col border-r border-border bg-card",
        className,
      )}
      style={
        {
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        } as React.CSSProperties
      }
    >
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-tight text-foreground"
        >
          Fitness Tracker
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {APP_NAV_ITEMS.map((item) => {
          const active = isNavRouteActive(pathname, item.href);
          const Icon = NAV_MENU_ICONS[item.iconKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={getNavItemClassName(active)}
            >
              <Icon className="size-6 shrink-0" active={active} />
              <span className="capitalize">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
