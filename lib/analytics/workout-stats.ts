import { weekKey } from "@/lib/analytics/date-range";
import type {
  WeeklyFrequencyPoint,
  WeeklyVolumePoint,
  WorkoutAnalyticsSummary,
} from "@/types/analytics";
import type { SetRowForAnalytics } from "@/lib/db/queries/analytics";

function setVolumeKg(row: SetRowForAnalytics): number {
  if (row.isWarmup || row.reps == null || row.weightKg == null) return 0;
  if (row.reps <= 0 || row.weightKg <= 0) return 0;
  return row.reps * row.weightKg;
}

export function computeStreaks(sortedDates: string[]): {
  current: number;
  longest: number;
} {
  if (sortedDates.length === 0) return { current: 0, longest: 0 };

  const unique = [...new Set(sortedDates)].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${unique[i - 1]}T12:00:00`);
    const curr = new Date(`${unique[i]}T12:00:00`);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (diffDays > 1) {
      run = 1;
    }
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const last = new Date(`${unique[unique.length - 1]}T12:00:00`);
  const daysSinceLast = Math.round(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLast > 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    const prev = new Date(`${unique[i]}T12:00:00`);
    const next = new Date(`${unique[i + 1]}T12:00:00`);
    const diffDays = Math.round(
      (next.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 1) current += 1;
    else break;
  }

  return { current, longest };
}

export function buildWorkoutAnalytics(
  setRows: SetRowForAnalytics[],
  workoutDatesInRange: string[],
  allWorkoutDates: string[],
): WorkoutAnalyticsSummary {
  const volumeByWeek = new Map<string, number>();
  const workoutsByWeek = new Map<string, Set<string>>();

  for (const row of setRows) {
    const week = weekKey(row.workoutDate);
    volumeByWeek.set(week, (volumeByWeek.get(week) ?? 0) + setVolumeKg(row));
  }

  for (const date of workoutDatesInRange) {
    const week = weekKey(date);
    if (!workoutsByWeek.has(week)) {
      workoutsByWeek.set(week, new Set());
    }
    workoutsByWeek.get(week)!.add(date);
  }

  const weeks = [
    ...new Set([...volumeByWeek.keys(), ...workoutsByWeek.keys()]),
  ].sort();

  const weeklyVolume: WeeklyVolumePoint[] = weeks.map((week) => ({
    week,
    volumeKg: Math.round((volumeByWeek.get(week) ?? 0) * 10) / 10,
    workoutCount: workoutsByWeek.get(week)?.size ?? 0,
  }));

  const weeklyFrequency: WeeklyFrequencyPoint[] = weeks.map((week) => ({
    week,
    sessions: workoutsByWeek.get(week)?.size ?? 0,
  }));

  const totalVolumeKg = setRows.reduce((sum, r) => sum + setVolumeKg(r), 0);
  const streaks = computeStreaks(allWorkoutDates);

  return {
    totalWorkouts: new Set(workoutDatesInRange).size,
    totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    weeklyVolume,
    weeklyFrequency,
  };
}
