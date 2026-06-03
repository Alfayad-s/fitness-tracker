"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type TypewriterTextProps = {
  text: string;
  /** When false, show the full message immediately (past replies). */
  animate?: boolean;
  className?: string;
  onComplete?: () => void;
  onProgress?: () => void;
};

function getChunkSize(length: number): number {
  if (length > 2000) return 8;
  if (length > 800) return 4;
  if (length > 300) return 2;
  return 1;
}

function getTickMs(length: number): number {
  if (length > 2000) return 12;
  if (length > 800) return 16;
  return 20;
}

export function TypewriterText({
  text,
  animate = false,
  className,
  onComplete,
  onProgress,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState(animate ? "" : text);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);

  onCompleteRef.current = onComplete;
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!animate) {
      setDisplayed(text);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      setDisplayed(text);
      if (!completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
      return;
    }

    completedRef.current = false;
    setDisplayed("");

    const chunk = getChunkSize(text.length);
    const tickMs = getTickMs(text.length);
    let index = 0;

    const tick = () => {
      index = Math.min(index + chunk, text.length);
      setDisplayed(text.slice(0, index));
      onProgressRef.current?.();

      if (index >= text.length) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        return;
      }
    };

    tick();
    const id = window.setInterval(tick, tickMs);
    return () => window.clearInterval(id);
  }, [text, animate]);

  const isAnimating = animate && displayed.length < text.length;

  return (
    <span className={cn(className)}>
      {displayed}
      {isAnimating && (
        <span
          className="ml-0.5 inline-block w-[2px] animate-pulse bg-neutral-400 align-middle"
          style={{ height: "1em" }}
          aria-hidden
        />
      )}
    </span>
  );
}
