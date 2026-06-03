"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { StreakFireIcon } from "@/components/ui/streak-fire-icon";
import { cn } from "@/lib/utils";

interface StreakResponse {
  length: number;
  frequency: "daily" | "weekly" | "monthly";
}

const streakBadgeVariants = cva(
  "text-card-foreground transition-colors",
  {
    variants: {
      layout: {
        default:
          "inline-flex flex-col items-center justify-center rounded-3xl border border-border/60 bg-card text-center",
        capsule:
          "inline-flex flex-row items-center justify-center gap-1 rounded-full border-0 bg-transparent text-left",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    compoundVariants: [
      { layout: "default", size: "sm", class: "w-24 gap-1 rounded-2xl p-2.5" },
      {
        layout: "default",
        size: "default",
        class: "w-40 gap-2.5 p-5",
      },
      { layout: "default", size: "lg", class: "w-52 gap-3 p-6" },
      {
        layout: "capsule",
        size: "sm",
        class: "h-9 min-h-9 gap-1.5 px-0.5",
      },
      {
        layout: "capsule",
        size: "default",
        class: "h-9 gap-1.5 px-1",
      },
      {
        layout: "capsule",
        size: "lg",
        class: "h-10 gap-2 px-1.5",
      },
    ],
    defaultVariants: {
      layout: "default",
      size: "default",
    },
  },
);

interface StreakBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof streakBadgeVariants> {
  length?: number;
  frequency?: StreakResponse["frequency"];
  subtitle?: string;
  icon?: React.ReactNode;
  /** Hide subtitle row (default layout) or unit label (capsule layout) */
  hideSubtitle?: boolean;
}

const StreakBadge = React.forwardRef<HTMLDivElement, StreakBadgeProps>(
  (
    {
      className,
      layout,
      size,
      length,
      frequency = "daily",
      subtitle,
      icon,
      hideSubtitle = false,
      ...props
    },
    ref,
  ) => {
    const streakLength = length ?? 0;
    const resolvedLayout = layout ?? "default";
    const resolvedSize = size ?? "default";

    const frequencyLabel = {
      daily: "day",
      weekly: "week",
      monthly: "month",
    }[frequency];

    const pluralLabel =
      streakLength === 1 ? frequencyLabel : `${frequencyLabel}s`;
    const dayLabel = streakLength === 1 ? "Day" : "Days";

    const fireSize = {
      sm: resolvedLayout === "capsule" ? "sm" : "lg",
      default: resolvedLayout === "capsule" ? "sm" : "2xl",
      lg: resolvedLayout === "capsule" ? "md" : "2xl",
    }[resolvedSize] as "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

    const valueSize = {
      sm: resolvedLayout === "capsule" ? "text-base" : "text-xl",
      default:
        resolvedLayout === "capsule" ? "text-base" : "text-5xl",
      lg: resolvedLayout === "capsule" ? "text-lg" : "text-6xl",
    }[resolvedSize];

    const capsuleDayLabelSize = {
      sm: "text-sm",
      default: "text-sm",
      lg: "text-base",
    }[resolvedSize];

    const subtitleSize = {
      sm: "text-[10px]",
      default: "text-sm",
      lg: "text-base",
    }[resolvedSize];

    const subtitleText = subtitle ?? "streak";
    const valueUnit = pluralLabel;
    const ariaLabel = `${streakLength} ${pluralLabel} streak`;

    if (resolvedLayout === "capsule") {
      return (
        <div
          ref={ref}
          role="status"
          aria-label={ariaLabel}
          className={cn(
            streakBadgeVariants({ layout: "capsule", size: resolvedSize }),
            className,
          )}
          {...props}
        >
          {icon ?? <StreakFireIcon size={fireSize} />}
          <span
            className={cn(
              "inline-flex items-baseline gap-1 whitespace-nowrap font-bold tabular-nums leading-none text-black dark:text-foreground",
              valueSize,
            )}
            aria-hidden="true"
          >
            {streakLength}
            {!hideSubtitle ? (
              <span
                className={cn(
                  "font-bold text-black dark:text-foreground",
                  capsuleDayLabelSize,
                )}
              >
                {dayLabel}
              </span>
            ) : null}
          </span>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="status"
        aria-label={ariaLabel}
        className={cn(
          streakBadgeVariants({ layout: "default", size: resolvedSize }),
          className,
        )}
        {...props}
      >
        {icon ?? <StreakFireIcon size={fireSize} />}
        <span
          className={cn("font-semibold tracking-tight", valueSize)}
          aria-hidden="true"
        >
          {streakLength}
          <span
            className={cn(
              "font-medium text-muted-foreground",
              resolvedSize === "sm" ? "ml-1 text-sm" : "ml-2",
            )}
          >
            {valueUnit}
          </span>
        </span>
        {!hideSubtitle ? (
          <span
            className={cn("font-normal text-muted-foreground", subtitleSize)}
            aria-hidden="true"
          >
            {subtitleText}
          </span>
        ) : null}
      </div>
    );
  },
);
StreakBadge.displayName = "StreakBadge";

export { StreakBadge, streakBadgeVariants };
export type { StreakBadgeProps, StreakResponse };
