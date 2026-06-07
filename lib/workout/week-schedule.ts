import { addDaysToDateString } from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import type { DailyWorkoutPlanDetail } from "@/types/schemas/daily-plan";

export const WEEKDAY_LABELS_MON_FIRST = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export type WeekDayDisplayStatus =
  | "empty"
  | "rest"
  | "planned"
  | "skipped"
  | "completed"
  | "program-rest"
  | "program-workout";

export type WeekProgramHint = {
  label: string | null;
  isRestDay: boolean;
  templateId: string | null;
  templateName: string | null;
};

export type WeekScheduleDay = {
  planDate: string;
  weekdayLabel: (typeof WEEKDAY_LABELS_MON_FIRST)[number];
  dayOfMonth: number;
  isToday: boolean;
  plan: DailyWorkoutPlanDetail | null;
  programHint: WeekProgramHint | null;
  displayStatus: WeekDayDisplayStatus;
  displayTitle: string | null;
};

/** Monday of the week containing `dateStr` (YYYY-MM-DD). */
export function getWeekStartMonday(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const weekday = date.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDaysToDateString(dateStr, -daysFromMonday);
}

export function getWeekDatesFromMondayStart(weekStartMonday: string): string[] {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateString(weekStartMonday, index),
  );
}

export function dayOfMonthFromDateString(dateStr: string): number {
  return Number.parseInt(dateStr.slice(8, 10), 10);
}

export function isRestPlan(plan: DailyWorkoutPlanDetail): boolean {
  return (
    plan.exercises.length === 0 &&
    plan.title.toLowerCase().includes("rest")
  );
}

export function resolveWeekDayDisplay(
  plan: DailyWorkoutPlanDetail | null,
  programHint: WeekProgramHint | null,
): { displayStatus: WeekDayDisplayStatus; displayTitle: string | null } {
  if (plan) {
    if (plan.status === "skipped") {
      return { displayStatus: "skipped", displayTitle: "Rest day" };
    }
    if (plan.status === "completed") {
      return { displayStatus: "completed", displayTitle: plan.title };
    }
    if (isRestPlan(plan)) {
      return { displayStatus: "rest", displayTitle: plan.title };
    }
    return { displayStatus: "planned", displayTitle: plan.title };
  }

  if (programHint?.isRestDay) {
    return {
      displayStatus: "program-rest",
      displayTitle: programHint.label ?? "Rest",
    };
  }

  if (programHint?.templateId) {
    return {
      displayStatus: "program-workout",
      displayTitle:
        programHint.label ?? programHint.templateName ?? "Workout",
    };
  }

  return { displayStatus: "empty", displayTitle: null };
}

export function formatWeekRangeLabel(
  weekStartMonday: string,
  reference = todayDateString(),
): string {
  const weekEnd = addDaysToDateString(weekStartMonday, 6);
  const startMonth = new Date(`${weekStartMonday}T12:00:00`).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
  const endMonth = new Date(`${weekEnd}T12:00:00`).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
  const startDay = dayOfMonthFromDateString(weekStartMonday);
  const endDay = dayOfMonthFromDateString(weekEnd);

  if (weekStartMonday <= reference && reference <= weekEnd) {
    return "This week";
  }

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }

  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}
