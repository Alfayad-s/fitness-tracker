"use client";

import * as React from "react";

import type { StreakPeriod } from "@/lib/analytics/streak-periods";
import { cn } from "@/lib/utils";

export type { StreakPeriod };

type StreakCalendarProps = {
  streak: StreakPeriod[];
  view?: "week";
  /** 0 = Sunday, 1 = Monday */
  startOfWeek?: 0 | 1;
  className?: string;
};

const LABELS_MON_START = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LABELS_SUN_START = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isActiveOnDate(dateKey: string, streak: StreakPeriod[]): boolean {
  return streak.some(
    (period) => dateKey >= period.periodStart && dateKey <= period.periodEnd,
  );
}

function getWeekDays(anchor: Date, startOfWeek: 0 | 1): Date[] {
  const d = new Date(anchor);
  d.setHours(12, 0, 0, 0);
  const weekday = d.getDay();
  const offset =
    startOfWeek === 1
      ? weekday === 0
        ? -6
        : 1 - weekday
      : -weekday;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() + offset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
}

export function StreakCalendar({
  streak,
  view = "week",
  startOfWeek = 1,
  className,
}: StreakCalendarProps) {
  const labels = startOfWeek === 1 ? LABELS_MON_START : LABELS_SUN_START;
  const todayKey = formatDateKey(new Date());
  const weekDays = getWeekDays(new Date(), startOfWeek);

  if (view !== "week") {
    return null;
  }

  return (
    <div
      className={cn("grid max-w-md grid-cols-7 gap-2", className)}
      role="img"
      aria-label="Weekly workout activity"
    >
      {weekDays.map((date, index) => {
        const dateKey = formatDateKey(date);
        const active = isActiveOnDate(dateKey, streak);
        const isToday = dateKey === todayKey;

        return (
          <div key={dateKey} className="flex flex-col items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              {labels[index]}
            </span>
            <div
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                active
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/80 bg-muted/50 text-muted-foreground",
                isToday && "ring-2 ring-primary/35",
              )}
            >
              {date.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
