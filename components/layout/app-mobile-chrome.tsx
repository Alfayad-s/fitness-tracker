"use client";

import { AppHeaderBar } from "@/components/layout/app-header-bar";
import { HeaderStreakPin } from "@/components/layout/header-streak-pin";
import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
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
  const chromeVisible = useScrollChromeVisible();

  return (
    <>
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-40 overflow-visible transition-transform duration-300 ease-out will-change-transform",
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
