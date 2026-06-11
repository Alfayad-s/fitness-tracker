"use client";

import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/layout/BottomNav";
import { PageBackButton } from "@/components/layout/page-back-button";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { ScrollChromeProvider } from "@/components/layout/scroll-chrome-provider";
import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
import {
  StreakLayoutProvider,
  useStreakLayoutPin,
} from "@/components/layout/streak-layout-context";
import {
  useIsMobileViewport,
  useMobileTopChromeOffset,
} from "@/hooks/use-mobile-top-chrome-offset";
import {
  isHomeRoute,
  mobileStreakPinContentPaddingTop,
} from "@/lib/layout/mobile-header-metrics";
import { cn } from "@/lib/utils";

/** Marker slot — render mobile header inside AppShell so layout context is available. */
export function AppShellHeader({ children }: { children: ReactNode }) {
  return children;
}

AppShellHeader.displayName = "AppShellHeader";

type AppShellProps = {
  children: ReactNode;
};

const NAV_OFFSET =
  "calc(6.25rem + env(safe-area-inset-bottom, 0px))";

function splitAppShellChildren(children: ReactNode): {
  header: ReactNode;
  content: ReactNode[];
} {
  const content: ReactNode[] = [];
  let header: ReactNode = null;

  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as { displayName?: string }).displayName === "AppShellHeader"
    ) {
      header = (child as ReactElement<{ children: ReactNode }>).props.children;
      return;
    }
    content.push(child);
  });

  return { header, content };
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ScrollChromeProvider>
      <StreakLayoutProvider>
        <AppShellInner>{children}</AppShellInner>
      </StreakLayoutProvider>
    </ScrollChromeProvider>
  );
}

function AppShellInner({ children }: AppShellProps) {
  const pathname = usePathname();
  const chromeVisible = useScrollChromeVisible();
  const isMobile = useIsMobileViewport();
  const { showStreakPin: hasStreakPin } = useStreakLayoutPin();
  const { header, content } = splitAppShellChildren(children);
  const onHome = isHomeRoute(pathname);
  const mobilePaddingTop = useMobileTopChromeOffset({
    enabled: Boolean(header),
    assumeStreakOnHome: onHome,
  });

  const resolvedMobilePaddingTop =
    header && isMobile
      ? chromeVisible
        ? mobilePaddingTop
        : onHome && hasStreakPin
          ? mobileStreakPinContentPaddingTop
          : "env(safe-area-inset-top, 0px)"
      : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-1">
      <DesktopSidebar className="hidden md:flex" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header ? <div className="md:hidden">{header}</div> : null}

        <div
          data-app-shell-content
          data-home-route={onHome ? "true" : undefined}
          data-streak-pin={onHome && hasStreakPin ? "true" : undefined}
          className={cn(
            "app-shell-content flex min-h-0 flex-1 flex-col transition-[padding] duration-150 ease-out",
            header ? "max-md:pb-[var(--app-nav-offset)]" : "pb-0 pt-0",
            !header && "max-md:pb-[var(--app-nav-offset)]",
            "md:py-0 md:pb-0",
          )}
          style={
            {
              "--app-nav-offset": NAV_OFFSET,
              paddingTop: resolvedMobilePaddingTop,
            } as React.CSSProperties
          }
        >
          <PageBackButton />
          {content}
        </div>

        <div
          className={cn(
            "fixed inset-x-0 z-50 transition-transform duration-150 ease-out md:hidden",
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
