"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { NAV_MENU_ICONS } from "@/components/layout/nav-menu-icon";
import {
  InteractiveMenu,
  type InteractiveMenuItem,
} from "@/components/ui/modern-mobile-menu";
import { APP_NAV_ITEMS, type AppNavIconKey } from "@/lib/navigation/app-nav";
import { getActiveNavIndex } from "@/lib/navigation/nav-active";
import { NAV_ACCENT_COLOR } from "@/lib/navigation/nav-styles";

const menuItems: InteractiveMenuItem[] = APP_NAV_ITEMS.map((item) => ({
  label: item.label,
  icon: NAV_MENU_ICONS[item.iconKey as AppNavIconKey],
}));

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIndex = useMemo(
    () => getActiveNavIndex(pathname, APP_NAV_ITEMS),
    [pathname],
  );

  return (
    <div
      className="px-3"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <InteractiveMenu
        items={menuItems}
        activeIndex={activeIndex}
        accentColor={NAV_ACCENT_COLOR}
        onItemChange={(index) => {
          const route = APP_NAV_ITEMS[index];
          if (route && !pathname.startsWith(route.href)) {
            router.push(route.href);
          }
        }}
      />
    </div>
  );
}
