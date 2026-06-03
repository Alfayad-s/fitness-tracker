"use client";

import { motion } from "motion/react";
import React, { useMemo, useState } from "react";

import { toDateKey } from "@/lib/attendance";
import { cn } from "@/lib/utils";

export interface ContributionData {
  date: string;
  count: number;
  level: number;
}

export type ContributionGraphVariant = "contribution" | "attendance";

export interface ContributionGraphProps {
  data?: ContributionData[];
  year?: number;
  className?: string;
  showLegend?: boolean;
  showTooltips?: boolean;
  variant?: ContributionGraphVariant;
  /** When set, shows only the last N calendar months (no horizontal scroll). */
  monthsToShow?: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const FULL_COLORS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900/50",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-600 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-500",
];

const ATTENDANCE_MISSED = "bg-muted";
const ATTENDANCE_ACTIVE = "bg-emerald-600 dark:bg-emerald-500";

const FULL_LEVELS = [0, 1, 2, 3, 4];
const ATTENDANCE_LEVELS = [0, 1];

type GridResult = {
  days: ContributionData[];
  weekCount: number;
  monthHeaders: { month: string; colspan: number }[];
};

function buildYearGrid(data: ContributionData[], year: number): GridResult {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const days: ContributionData[] = [];

  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  for (let week = 0; week < 53; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(firstSunday);
      currentDate.setDate(firstSunday.getDate() + week * 7 + day);

      const isInRange = currentDate >= startDate && currentDate <= endDate;
      const isPreviousYearDecember =
        currentDate.getFullYear() === year - 1 && currentDate.getMonth() === 11;
      const isNextYearJanuary =
        currentDate.getFullYear() === year + 1 && currentDate.getMonth() === 0;

      if (isInRange || isPreviousYearDecember || isNextYearJanuary) {
        const dateString = toDateKey(currentDate);
        const existingData = data.find((d) => d.date === dateString);
        days.push({
          date: dateString,
          count: existingData?.count ?? 0,
          level: existingData?.level ?? 0,
        });
      } else {
        days.push({ date: "", count: 0, level: 0 });
      }
    }
  }

  const monthHeaders: GridResult["monthHeaders"] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let weekCount = 0;

  for (let week = 0; week < 53; week++) {
    const weekDate = new Date(firstSunday);
    weekDate.setDate(firstSunday.getDate() + week * 7);
    const monthKey = weekDate.getMonth();
    const yearKey = weekDate.getFullYear();

    if (monthKey !== currentMonth || yearKey !== currentYear) {
      if (currentMonth !== -1) {
        const shouldShowMonth =
          currentYear === year ||
          (currentYear === year - 1 &&
            currentMonth === 11 &&
            startDate.getDay() !== 0 &&
            weekCount >= 2);

        if (shouldShowMonth) {
          monthHeaders.push({ month: MONTHS[currentMonth], colspan: weekCount });
        }
      }
      currentMonth = monthKey;
      currentYear = yearKey;
      weekCount = 1;
    } else {
      weekCount++;
    }
  }

  if (currentMonth !== -1) {
    const shouldShowMonth =
      currentYear === year ||
      (currentYear === year - 1 &&
        currentMonth === 11 &&
        startDate.getDay() !== 0 &&
        weekCount >= 2);

    if (shouldShowMonth) {
      monthHeaders.push({ month: MONTHS[currentMonth], colspan: weekCount });
    }
  }

  return { days, weekCount: 53, monthHeaders };
}

function buildMonthsGrid(
  data: ContributionData[],
  monthsToShow: number,
): GridResult {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getFullYear(), end.getMonth() - (monthsToShow - 1), 1);
  start.setHours(0, 0, 0, 0);

  const firstSunday = new Date(start);
  firstSunday.setDate(start.getDate() - start.getDay());

  const lastSaturday = new Date(end);
  lastSaturday.setDate(end.getDate() + (6 - end.getDay()));

  const days: ContributionData[] = [];

  for (
    let cursor = new Date(firstSunday);
    cursor <= lastSaturday;
    cursor.setDate(cursor.getDate() + 7)
  ) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(cursor);
      currentDate.setDate(cursor.getDate() + day);

      if (currentDate >= start && currentDate <= end) {
        const dateString = toDateKey(currentDate);
        const existingData = data.find((d) => d.date === dateString);
        const count = existingData?.count ?? 0;
        days.push({
          date: dateString,
          count,
          level: count > 0 ? 1 : 0,
        });
      } else {
        days.push({ date: "", count: 0, level: 0 });
      }
    }
  }

  const weekCount = days.length / 7;

  const monthHeaders: GridResult["monthHeaders"] = [];
  let currentMonth = -1;
  let span = 0;

  for (let week = 0; week < weekCount; week++) {
    const weekStart = new Date(firstSunday);
    weekStart.setDate(firstSunday.getDate() + week * 7);
    const monthKey = weekStart.getMonth();

    if (monthKey !== currentMonth) {
      if (currentMonth !== -1) {
        monthHeaders.push({ month: MONTHS[currentMonth], colspan: span });
      }
      currentMonth = monthKey;
      span = 1;
    } else {
      span++;
    }
  }

  if (currentMonth !== -1) {
    monthHeaders.push({ month: MONTHS[currentMonth], colspan: span });
  }

  return { days, weekCount, monthHeaders };
}

export function ContributionGraph({
  data = [],
  year = new Date().getFullYear(),
  className = "",
  showLegend = true,
  showTooltips = true,
  variant = "contribution",
  monthsToShow,
}: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const isAttendance = variant === "attendance";
  const useWindow = monthsToShow != null && monthsToShow > 0;

  const grid = useMemo(() => {
    if (useWindow) {
      return buildMonthsGrid(data, monthsToShow);
    }
    return buildYearGrid(data, year);
  }, [data, year, monthsToShow, useWindow]);

  const { days: gridDays, weekCount, monthHeaders } = grid;

  const getCellColor = (day: ContributionData) => {
    if (isAttendance || useWindow) {
      return day.count > 0 ? ATTENDANCE_ACTIVE : ATTENDANCE_MISSED;
    }
    return FULL_COLORS[day.level] ?? FULL_COLORS[0];
  };

  const legendLevels = isAttendance || useWindow ? ATTENDANCE_LEVELS : FULL_LEVELS;
  const legendColors =
    isAttendance || useWindow
      ? [ATTENDANCE_MISSED, ATTENDANCE_ACTIVE]
      : FULL_COLORS;

  const handleDayHover = (day: ContributionData, event: React.MouseEvent) => {
    if (showTooltips && day.date) {
      setHoveredDay(day);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleDayLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getActivityText = (count: number) => {
    if (isAttendance) {
      if (count === 0) return "Rest day — no workout";
      if (count === 1) return "Workout logged";
      return `${count} workouts logged`;
    }
    if (count === 0) return "No contributions";
    if (count === 1) return "1 contribution";
    return `${count} contributions`;
  };

  const caption = isAttendance
    ? `Daily training attendance`
    : `Contribution graph for ${year}`;

  const legendLess = isAttendance ? "Missed" : "Less";
  const legendMore = isAttendance ? "Attended" : "More";

  const attendedDays = useMemo(() => data.filter((d) => d.count > 0).length, [data]);

  return (
    <div className={cn("contribution-graph", className)}>
      {isAttendance && (
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{attendedDays}</span>{" "}
            active days in this period
          </p>
        </div>
      )}

      <div className={cn(!useWindow && "overflow-x-auto")}>
        <table className="w-full border-separate border-spacing-1 text-xs">
          <caption className="sr-only">{caption}</caption>

          <thead>
            <tr className="h-3">
              <td className="w-7 min-w-7" />
              {monthHeaders.map((header, index) => (
                <td
                  key={index}
                  className="relative text-left text-foreground"
                  colSpan={header.colspan}
                >
                  <span className="absolute top-0 left-1">{header.month}</span>
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <tr key={dayIndex} className="h-2.5">
                <td className="relative w-7 min-w-7 text-foreground">
                  {dayIndex % 2 === 0 && (
                    <span className="absolute -bottom-0.5 left-0 text-xs">
                      {DAYS[dayIndex]}
                    </span>
                  )}
                </td>

                {Array.from({ length: weekCount }, (_, weekIndex) => {
                  const dayData = gridDays[weekIndex * 7 + dayIndex];
                  if (!dayData?.date) {
                    return (
                      <td key={weekIndex} className="h-2.5 w-2.5 p-0">
                        <div className="h-2.5 w-2.5" />
                      </td>
                    );
                  }

                  return (
                    <td
                      key={weekIndex}
                      className="h-2.5 w-2.5 cursor-pointer p-0"
                      onMouseEnter={(e) => handleDayHover(dayData, e)}
                      onMouseLeave={handleDayLeave}
                      title={
                        showTooltips
                          ? `${formatDate(dayData.date)}: ${getActivityText(dayData.count)}`
                          : undefined
                      }
                    >
                      <div
                        className={cn(
                          "h-2.5 w-2.5 rounded-sm hover:ring-2 hover:ring-background",
                          getCellColor(dayData),
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTooltips && hoveredDay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
          }}
        >
          <div className="font-semibold">{getActivityText(hoveredDay.count)}</div>
          <div className="text-muted-foreground">{formatDate(hoveredDay.date)}</div>
        </motion.div>
      )}

      {showLegend && (
        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <span>{legendLess}</span>
          <div className="flex items-center gap-1.5">
            {legendLevels.map((level) => (
              <div
                key={level}
                className={cn("h-3 w-3 rounded-sm", legendColors[level])}
              />
            ))}
          </div>
          <span>{legendMore}</span>
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
