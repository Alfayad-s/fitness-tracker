"use client";

import { useEffect } from "react";

/**
 * Sets --keyboard-inset on the document root when the on-screen keyboard
 * reduces the visual viewport (iOS Safari / mobile browsers).
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const inset = Math.max(
        0,
        window.innerHeight - vv.height - vv.offsetTop,
      );
      document.documentElement.style.setProperty(
        "--keyboard-inset",
        `${inset}px`,
      );
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []);
}
