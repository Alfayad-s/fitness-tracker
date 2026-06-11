"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

import { isHomeRoute } from "@/lib/layout/mobile-header-metrics";

import { AppHeaderBar } from "@/components/layout/app-header-bar";
import { HeaderStreakPin } from "@/components/layout/header-streak-pin";
import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
import { useStreakLayoutPin } from "@/components/layout/streak-layout-context";
import { cn } from "@/lib/utils";

type AppMobileChromeProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
  currentStreak: number;
};

export function AppMobileChrome({
  avatarUrl,
  displayName,
  email,
  currentStreak,
}: AppMobileChromeProps) {
  const pathname = usePathname();
  const chromeVisible = useScrollChromeVisible();
  const { setShowStreakPin } = useStreakLayoutPin();
  const showStreakPin = isHomeRoute(pathname) && currentStreak >= 1;

  useLayoutEffect(() => {
    setShowStreakPin(showStreakPin);
    return () => setShowStreakPin(false);
  }, [showStreakPin, setShowStreakPin]);

  return (
    <>
      <div
        data-app-header-chrome
        className={cn(
          "fixed inset-x-0 top-0 z-40 overflow-visible transition-transform duration-150 ease-out",
          chromeVisible
            ? "translate-y-0"
            : "max-md:-translate-y-full max-md:pointer-events-none",
        )}
        aria-hidden={!chromeVisible ? true : undefined}
      >
        <AppHeaderBar
          avatarUrl={avatarUrl}
          displayName={displayName}
          email={email}
          currentStreak={currentStreak}
        />
      </div>
      <HeaderStreakPin currentStreak={currentStreak} />
    </>
  );
}
