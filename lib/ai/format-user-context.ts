import { estimateOneRepMax } from "@/lib/analytics/exercise-progress";
import type { SetRowForAnalytics } from "@/lib/db/queries/analytics";
import type { WorkoutDetail } from "@/lib/db/queries/workouts";
import { feelingLabel } from "@/lib/workout/format";
import type { BodyMeasurement, BodyMeasurementMap } from "@/types";

export const MAX_CONTEXT_CHARS = 28_000;

export function truncateAiContext(text: string, maxChars = MAX_CONTEXT_CHARS): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Context truncated for length — older entries omitted.]`;
}

function formatMeasurementMap(map: BodyMeasurementMap | null | undefined): string {
  if (!map || Object.keys(map).length === 0) return "";
  const parts = Object.entries(map)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${k.replace(/Cm$/, "")} ${v}cm`);
  return parts.length ? ` | circumferences: ${parts.join(", ")}` : "";
}

export function formatBodyMeasurementRow(m: BodyMeasurement): string {
  const date = m.recordedAt.toISOString().slice(0, 10);
  const weight =
    m.weightKg != null ? `weight ${Number(m.weightKg)}kg` : null;
  const bf =
    m.bodyFatPercent != null
      ? `body fat ${Number(m.bodyFatPercent)}%`
      : null;
  const extras = formatMeasurementMap(m.measurements ?? undefined);
  const body = [weight, bf].filter(Boolean).join(", ");
  return `${date}: ${body || "logged"}${extras}`;
}

function formatSetLine(
  reps: number | null,
  weightKg: string | null,
  isWarmup: boolean,
): string {
  const w = weightKg != null ? Number(weightKg) : null;
  const label = isWarmup ? " (warmup)" : "";
  if (w != null && reps != null) return `${w}kg×${reps}${label}`;
  if (reps != null) return `${reps} reps${label}`;
  return `set${label}`;
}

export function formatWorkoutDetailForContext(workout: WorkoutDetail): string {
  const feeling = workout.feeling ? feelingLabel(workout.feeling) : null;
  const duration =
    workout.duration != null
      ? ` | ${Math.round(workout.duration / 60)} min`
      : "";
  const meta = [feeling ? `feeling: ${feeling}` : null]
    .filter(Boolean)
    .join(", ");

  const header = `${workout.date} | ${workout.title}${duration}${meta ? ` | ${meta}` : ""}`;
  const exercises = workout.workoutExercises
    .map((we) => {
      const setStr = we.sets
        .map((s) =>
          formatSetLine(s.reps, s.weightKg, s.isWarmup),
        )
        .join(", ");
      return `  - ${we.exercise.name}${setStr ? `: ${setStr}` : ""}`;
    })
    .join("\n");

  return `${header}\n${exercises}`;
}

export type ExercisePrEntry = {
  exerciseName: string;
  date: string;
  maxWeightKg: number;
  estimated1RmKg: number;
};

/** Best estimated 1RM per exercise from analytics rows (last 90d). */
export function buildExercisePrsFromSetRows(
  setRows: SetRowForAnalytics[],
): ExercisePrEntry[] {
  const byExercise = new Map<
    string,
    { name: string; best: ExercisePrEntry }
  >();

  for (const row of setRows) {
    if (row.isWarmup || row.weightKg == null || row.reps == null || row.reps <= 0)
      continue;

    const e1rm = estimateOneRepMax(row.weightKg, row.reps);
    const existing = byExercise.get(row.exerciseId);
    if (!existing || e1rm > existing.best.estimated1RmKg) {
      byExercise.set(row.exerciseId, {
        name: row.exerciseName,
        best: {
          exerciseName: row.exerciseName,
          date: row.workoutDate,
          maxWeightKg: row.weightKg,
          estimated1RmKg: Math.round(e1rm * 10) / 10,
        },
      });
    } else if (e1rm === existing.best.estimated1RmKg && row.weightKg > existing.best.maxWeightKg) {
      existing.best.maxWeightKg = row.weightKg;
      existing.best.date = row.workoutDate;
    }
  }

  return [...byExercise.values()]
    .map((e) => e.best)
    .sort((a, b) => b.estimated1RmKg - a.estimated1RmKg);
}
