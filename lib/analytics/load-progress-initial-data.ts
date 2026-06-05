import { buildBodyAnalytics } from "@/lib/analytics/body-stats";
import { getDateRange } from "@/lib/analytics/date-range";
import { buildExerciseProgress } from "@/lib/analytics/exercise-progress";
import { buildWorkoutAnalytics } from "@/lib/analytics/workout-stats";
import { getRequestUser } from "@/lib/auth/require-user";
import {
  fetchAllWorkoutDates,
  fetchExercisesUsedByUser,
  fetchSetRowsForAnalytics,
  fetchWorkoutDatesInRange,
} from "@/lib/db/queries/analytics";
import {
  listBodyMeasurementsByUser,
  listBodyMeasurementsInRange,
} from "@/lib/db/queries/body-measurements";
import type {
  BodyAnalyticsSummary,
  ExerciseOption,
  ExerciseProgressSummary,
  WorkoutAnalyticsSummary,
} from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

export type ProgressInitialData = {
  workout: WorkoutAnalyticsSummary;
  body: BodyAnalyticsSummary;
  exercises: ExerciseOption[];
  measurements: BodyMeasurement[];
  exerciseProgress: ExerciseProgressSummary | null;
};

export async function loadProgressInitialData(): Promise<ProgressInitialData | null> {
  const user = await getRequestUser();
  if (!user) return null;

  const preset = "30d" as const;
  const range = getDateRange(preset);

  const [setRows, datesInRange, allDates, measurementsInRange, exercises, allMeasurements] =
    await Promise.all([
      fetchSetRowsForAnalytics(user.id, range),
      fetchWorkoutDatesInRange(user.id, range),
      fetchAllWorkoutDates(user.id),
      listBodyMeasurementsInRange(user.id, range),
      fetchExercisesUsedByUser(user.id),
      listBodyMeasurementsByUser(user.id),
    ]);

  const workout = buildWorkoutAnalytics(setRows, datesInRange, allDates);
  const body = buildBodyAnalytics(measurementsInRange);
  const measurements = allMeasurements.measurements ?? [];

  const firstExercise = exercises[0];
  const exerciseProgress = firstExercise
    ? buildExerciseProgress(setRows, firstExercise.id, firstExercise.name)
    : null;

  return {
    workout,
    body,
    exercises,
    measurements,
    exerciseProgress,
  };
}
