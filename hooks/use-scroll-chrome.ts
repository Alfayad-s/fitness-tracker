"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const SCROLL_DELTA_THRESHOLD = 8;
const TOP_REVEAL_OFFSET = 48;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

/**
 * Hides chrome on scroll down, reveals on scroll up (mobile only).
 */
export function useScrollChrome() {
  const pathname = usePathname();
  const [chromeVisible, setChromeVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    setChromeVisible(true);
    lastScrollY.current = window.scrollY;
  }, [pathname]);

  useEffect(() => {
    const update = () => {
      if (!isMobileViewport()) {
        setChromeVisible(true);
        return;
      }

      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY.current;

      if (scrollY <= TOP_REVEAL_OFFSET) {
        setChromeVisible(true);
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setChromeVisible(false);
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        setChromeVisible(true);
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    const onResize = () => {
      if (!isMobileViewport()) {
        setChromeVisible(true);
      }
    };

    lastScrollY.current = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return chromeVisible;
}
