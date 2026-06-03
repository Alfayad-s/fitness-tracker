import type { ContributionData } from "@/components/ui/contribution-graph";

/** Local calendar date key (YYYY-MM-DD). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Last N calendar months ending today (inclusive). */
export function getAttendanceWindow(months = 3): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

/** Binary level: 0 = missed, 1 = attended. */
export function workoutsToLevel(count: number): number {
  return count > 0 ? 1 : 0;
}

export function buildAttendanceFromWorkoutDates(
  workoutDates: string[],
  months = 3,
): ContributionData[] {
  const { start, end } = getAttendanceWindow(months);
  const counts = new Map<string, number>();

  for (const date of workoutDates) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const data: ContributionData[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d);
    const count = counts.get(key) ?? 0;
    data.push({ date: key, count, level: workoutsToLevel(count) });
  }

  return data;
}

/** Deterministic 0–99 from a date key (stable for SSR + client hydration). */
function stableAttendanceScore(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

/** Placeholder attendance until workouts are loaded from the API. */
export function generateSampleAttendanceData(months = 3): ContributionData[] {
  const { start, end } = getAttendanceWindow(months);
  const data: ContributionData[] = [];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const date = toDateKey(d);
    const attended = stableAttendanceScore(date) < 45;
    const count = attended ? 1 : 0;
    data.push({
      date,
      count,
      level: workoutsToLevel(count),
    });
  }

  return data;
}

export function formatAttendanceWindowLabel(months = 3): string {
  const { start, end } = getAttendanceWindow(months);
  const opts: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
  const startLabel = start.toLocaleDateString("en-US", opts);
  const endLabel = end.toLocaleDateString("en-US", opts);
  return `${startLabel} – ${endLabel}`;
}
