"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
import { StreakBadge } from "@/components/ui/streak-badge";
import {
  isHomeRoute,
  mobileHeaderStreakTopAttached,
  mobileHeaderStreakTopPinned,
  STREAK_CAPSULE_HEIGHT,
} from "@/lib/layout/mobile-header-metrics";
import { cn } from "@/lib/utils";

type HeaderStreakPinProps = {
  currentStreak: number;
};

export function HeaderStreakPin({ currentStreak }: HeaderStreakPinProps) {
  const pathname = usePathname();
  const chromeVisible = useScrollChromeVisible();
  const attached = chromeVisible;

  if (!isHomeRoute(pathname) || currentStreak < 1) {
    return null;
  }

  return (
    <Link
      href="/dashboard"
      className={cn(
        "fixed left-1/2 z-50 -translate-x-1/2 md:hidden",
        "inline-flex h-[var(--streak-capsule-height)] min-h-[var(--streak-capsule-height)] items-center rounded-full border border-border bg-card px-3.5 py-1.5 shadow-sm",
        "transition-[top] duration-300 ease-out will-change-[top]",
        "hover:bg-muted/80",
      )}
      style={{
        top: attached ? mobileHeaderStreakTopAttached : mobileHeaderStreakTopPinned,
        ["--streak-capsule-height" as string]: STREAK_CAPSULE_HEIGHT,
      }}
      aria-label={`${currentStreak} day streak, view dashboard`}
    >
      <StreakBadge
        layout="capsule"
        size="sm"
        length={currentStreak}
        frequency="daily"
      />
    </Link>
  );
}
