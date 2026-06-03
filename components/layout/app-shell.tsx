"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { PageBackButton } from "@/components/layout/page-back-button";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ScrollChromeProvider } from "@/components/layout/scroll-chrome-provider";
import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
import {
  isHomeRoute,
  mobileHeaderContentPaddingTop,
  mobileHeaderOnlyPaddingTop,
  mobileStreakPinContentPaddingTop,
} from "@/lib/layout/mobile-header-metrics";
import { cn } from "@/lib/utils";

type AppShellProps = {
  /** Shown on mobile only; desktop uses sidebar navigation. */
  header?: ReactNode;
  /** Reserve home layout space for the streak pin below the header. */
  showHomeStreakPin?: boolean;
  children: ReactNode;
};

const NAV_OFFSET =
  "calc(6.25rem + env(safe-area-inset-bottom, 0px))";

export function AppShell({
  header,
  showHomeStreakPin = false,
  children,
}: AppShellProps) {
  return (
    <ScrollChromeProvider>
      <AppShellInner header={header} showHomeStreakPin={showHomeStreakPin}>
        {children}
      </AppShellInner>
    </ScrollChromeProvider>
  );
}

function AppShellInner({
  header,
  showHomeStreakPin = false,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const chromeVisible = useScrollChromeVisible();
  const showStreakPin = isHomeRoute(pathname) && showHomeStreakPin;

  const mobilePaddingTop = !header
    ? undefined
    : chromeVisible
      ? showStreakPin
        ? "max-md:pt-[var(--app-header-with-streak-offset)]"
        : "max-md:pt-[var(--app-header-only-offset)]"
      : showStreakPin
        ? "max-md:pt-[var(--app-streak-only-offset)]"
        : "max-md:pt-[env(safe-area-inset-top,0px)]";

  return (
    <div className="flex min-h-[100dvh] flex-1">
      <DesktopSidebar className="hidden md:flex" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header ? <div className="md:hidden">{header}</div> : null}

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col transition-[padding] duration-300 ease-out",
            mobilePaddingTop,
            header ? "max-md:pb-[var(--app-nav-offset)]" : "pb-0 pt-0",
            !header && "max-md:pb-[var(--app-nav-offset)]",
            "md:py-0 md:pb-0",
          )}
          style={
            {
              "--app-header-with-streak-offset": mobileHeaderContentPaddingTop,
              "--app-header-only-offset": mobileHeaderOnlyPaddingTop,
              "--app-streak-only-offset": mobileStreakPinContentPaddingTop,
              "--app-nav-offset": NAV_OFFSET,
            } as React.CSSProperties
          }
        >
          <PageBackButton />
          {children}
        </div>

        <div
          className={cn(
            "fixed inset-x-0 z-50 transition-transform duration-300 ease-out will-change-transform md:hidden",
            "bottom-[var(--keyboard-inset,0px)]",
            chromeVisible
              ? "translate-y-0"
              : "translate-y-[calc(100%+1rem)] pointer-events-none",
          )}
          aria-hidden={!chromeVisible ? true : undefined}
        >
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
