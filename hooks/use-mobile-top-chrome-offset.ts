"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useMemo, useState } from "react";

import { useScrollChromeVisible } from "@/components/layout/scroll-chrome-provider";
import {
  isHomeRoute,
  mobileHeaderContentPaddingTop,
  mobileHeaderOnlyPaddingTop,
  mobileStreakPinContentPaddingTop,
} from "@/lib/layout/mobile-header-metrics";

/** Space between fixed chrome and page content (welcome message, etc.) */
const CONTENT_GAP_PX = 4;

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

function measureChromePaddingTop(chromeVisible: boolean): number {
  const headerChrome = document.querySelector<HTMLElement>(
    "[data-app-header-chrome]",
  );
  const streak = document.querySelector<HTMLElement>("[data-header-streak-pin]");

  let bottom = 0;

  if (chromeVisible && headerChrome) {
    bottom = headerChrome.getBoundingClientRect().bottom;
  }

  if (streak) {
    bottom = Math.max(bottom, streak.getBoundingClientRect().bottom);
  }

  if (bottom <= 0) {
    return 0;
  }

  return bottom + CONTENT_GAP_PX;
}

function staticFallbackPadding(
  pathname: string,
  chromeVisible: boolean,
  assumeStreakOnHome: boolean,
): string {
  if (!chromeVisible) {
    return assumeStreakOnHome && isHomeRoute(pathname)
      ? mobileStreakPinContentPaddingTop
      : "env(safe-area-inset-top, 0px)";
  }

  if (assumeStreakOnHome && isHomeRoute(pathname)) {
    return mobileHeaderContentPaddingTop;
  }

  return mobileHeaderOnlyPaddingTop;
}

type UseMobileTopChromeOffsetOptions = {
  enabled: boolean;
  assumeStreakOnHome: boolean;
};

/**
 * Measures fixed header + streak pin and returns padding-top for main content.
 */
export function useMobileTopChromeOffset({
  enabled,
  assumeStreakOnHome,
}: UseMobileTopChromeOffsetOptions): string {
  const pathname = usePathname();
  const chromeVisible = useScrollChromeVisible();
  const isMobile = useIsMobileViewport();

  const staticFallback = useMemo(
    () => staticFallbackPadding(pathname, chromeVisible, assumeStreakOnHome),
    [pathname, chromeVisible, assumeStreakOnHome],
  );

  const [paddingTop, setPaddingTop] = useState(staticFallback);

  useLayoutEffect(() => {
    setPaddingTop(staticFallback);
  }, [staticFallback]);

  useLayoutEffect(() => {
    if (!enabled || !isMobile) {
      return;
    }

    const update = () => {
      const measured = measureChromePaddingTop(chromeVisible);
      if (measured > 0) {
        setPaddingTop(`${measured}px`);
        return;
      }

      setPaddingTop(staticFallback);
    };

    update();

    const observed = document.querySelectorAll(
      "[data-app-header-chrome], [data-header-streak-pin]",
    );
    const resizeObserver = new ResizeObserver(update);
    observed.forEach((node) => resizeObserver.observe(node));

    window.addEventListener("resize", update);
    const t0 = window.setTimeout(update, 0);
    const t1 = window.setTimeout(update, 100);
    const t2 = window.setTimeout(update, 350);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [enabled, isMobile, chromeVisible, staticFallback]);

  if (!enabled || !isMobile) {
    return staticFallback;
  }

  return paddingTop;
}
