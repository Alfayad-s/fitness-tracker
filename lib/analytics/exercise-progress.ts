import {
  aggregateExerciseProgressByWeek,
  isLongDateRange,
} from "@/lib/analytics/chart-aggregation";
import type { DateRange } from "@/lib/analytics/date-range";
import type {
  ExerciseProgressPoint,
  ExerciseProgressSummary,
} from "@/types/analytics";
import type { SetRowForAnalytics } from "@/lib/db/queries/analytics";

/** Epley estimated 1RM: weight × (1 + reps/30) */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (reps <= 0) return weightKg;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export function buildExerciseProgress(
  setRows: SetRowForAnalytics[],
  exerciseId: string,
  exerciseName: string,
  range?: DateRange,
): ExerciseProgressSummary {
  const byDate = new Map<string, SetRowForAnalytics[]>();

  for (const row of setRows) {
    if (row.exerciseId !== exerciseId || row.isWarmup) continue;
    if (row.weightKg == null || row.reps == null || row.reps <= 0) continue;

    const list = byDate.get(row.workoutDate) ?? [];
    list.push(row);
    byDate.set(row.workoutDate, list);
  }

  let points: ExerciseProgressPoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      let maxWeightKg = 0;
      let estimated1RmKg = 0;
      let bestSetVolume = 0;

      for (const row of rows) {
        const w = row.weightKg!;
        const r = row.reps!;
        maxWeightKg = Math.max(maxWeightKg, w);
        estimated1RmKg = Math.max(estimated1RmKg, estimateOneRepMax(w, r));
        bestSetVolume = Math.max(bestSetVolume, w * r);
      }

      return {
        date,
        maxWeightKg: Math.round(maxWeightKg * 10) / 10,
        estimated1RmKg: Math.round(estimated1RmKg * 10) / 10,
        bestSetVolume: Math.round(bestSetVolume * 10) / 10,
      };
    });

  if (range && isLongDateRange(range)) {
    points = aggregateExerciseProgressByWeek(points);
  }

  return { exerciseId, exerciseName, points };
}
