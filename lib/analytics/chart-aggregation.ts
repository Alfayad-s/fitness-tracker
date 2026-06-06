import { weekKey, type DateRange } from "@/lib/analytics/date-range";
import type {
  BodyTrendPoint,
  ExerciseProgressPoint,
} from "@/types/analytics";

export const LONG_RANGE_DAY_THRESHOLD = 90;

export function getDateRangeDayCount(range: DateRange): number {
  const from = new Date(`${range.from}T12:00:00`);
  const to = new Date(`${range.to}T12:00:00`);
  return (
    Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

export function isLongDateRange(range: DateRange): boolean {
  return getDateRangeDayCount(range) > LONG_RANGE_DAY_THRESHOLD;
}

/** Collapse daily body points to one value per week (latest entry in each week). */
export function aggregateBodyTrendByWeek(
  points: BodyTrendPoint[],
): BodyTrendPoint[] {
  const byWeek = new Map<string, BodyTrendPoint>();

  for (const point of points) {
    const week = weekKey(point.date);
    const existing = byWeek.get(week);
    if (!existing || point.date >= existing.date) {
      byWeek.set(week, { ...point, date: week });
    }
  }

  return [...byWeek.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Collapse daily exercise points to weekly bests. */
export function aggregateExerciseProgressByWeek(
  points: ExerciseProgressPoint[],
): ExerciseProgressPoint[] {
  const byWeek = new Map<string, ExerciseProgressPoint>();

  for (const point of points) {
    const week = weekKey(point.date);
    const existing = byWeek.get(week);
    if (!existing) {
      byWeek.set(week, { ...point, date: week });
      continue;
    }

    byWeek.set(week, {
      date: week,
      maxWeightKg: Math.max(existing.maxWeightKg, point.maxWeightKg),
      estimated1RmKg: Math.max(existing.estimated1RmKg, point.estimated1RmKg),
      bestSetVolume: Math.max(existing.bestSetVolume, point.bestSetVolume),
    });
  }

  return [...byWeek.values()].sort((a, b) => a.date.localeCompare(b.date));
}
