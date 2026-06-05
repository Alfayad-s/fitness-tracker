"use client";

import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LazyPresetAvatarProps = {
  src: string;
  alt: string;
  selected?: boolean;
  saving?: boolean;
  disabled?: boolean;
  variant: "circle" | "memoji" | "pop-out";
  onSelect: () => void;
};

export function LazyPresetAvatar({
  src,
  alt,
  selected = false,
  saving = false,
  disabled = false,
  variant,
  onSelect,
}: LazyPresetAvatarProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    setRetryAttempt(0);
  }, [src]);

  const imageSrc =
    retryAttempt > 0 ? `${src}${src.includes("?") ? "&" : "?"}retry=${retryAttempt}` : src;

  const isCircle = variant === "circle";
  const isPopOut = variant === "pop-out";

  return (
    <button
      ref={rootRef}
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-label={alt}
      aria-pressed={selected}
      className={cn(
        "relative flex aspect-square items-center justify-center overflow-hidden border-2 bg-muted/40 transition-all",
        isCircle && "rounded-full",
        isPopOut && "rounded-2xl bg-transparent",
        !isCircle && !isPopOut && "rounded-xl",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-transparent hover:border-border",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {isVisible ? (
        failed ? (
          <span
            className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground"
            aria-hidden
          >
            ?
          </span>
        ) : (
          <>
            {!loaded && (
              <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
            )}
            <Image
              key={imageSrc}
              src={imageSrc}
              alt=""
              width={80}
              height={80}
              loading="lazy"
              unoptimized
              onLoad={() => setLoaded(true)}
              onError={() => {
                if (retryAttempt < 2) {
                  setRetryAttempt((attempt) => attempt + 1);
                  return;
                }
                setFailed(true);
              }}
              className={cn(
                "h-full w-full object-contain transition-opacity duration-200",
                isCircle && "object-cover",
                loaded ? "opacity-100" : "opacity-0",
              )}
            />
          </>
        )
      ) : (
        <span className="absolute inset-0 bg-muted/80" aria-hidden />
      )}

      {selected && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}

      {saving && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </span>
      )}
    </button>
  );
}
