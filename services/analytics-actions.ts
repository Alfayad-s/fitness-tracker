"use server";

import { buildBodyAnalytics } from "@/lib/analytics/body-stats";
import {
  getDateRange,
  type DateRangePreset,
} from "@/lib/analytics/date-range";
import { buildExerciseProgress } from "@/lib/analytics/exercise-progress";
import { buildWorkoutAnalytics } from "@/lib/analytics/workout-stats";
import {
  fetchAllWorkoutDates,
  fetchExercisesUsedByUser,
  fetchSetRowsForAnalytics,
  fetchWorkoutDatesInRange,
} from "@/lib/db/queries/analytics";
import { listBodyMeasurementsInRange } from "@/lib/db/queries/body-measurements";
import { getRequestUser } from "@/lib/auth/require-user";
import type {
  BodyAnalyticsSummary,
  ExerciseOption,
  ExerciseProgressSummary,
  WorkoutAnalyticsSummary,
} from "@/types/analytics";

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const user = await getRequestUser();
  if (!user) {
    return { error: "You must be signed in." };
  }
  return { userId: user.id };
}

export async function fetchWorkoutAnalytics(
  preset: DateRangePreset,
  custom?: { from?: string; to?: string },
): Promise<
  { data: WorkoutAnalyticsSummary } | { error: string; data: null }
> {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, data: null };
  }

  try {
    const range = getDateRange(preset, custom);
    const [setRows, datesInRange, allDates] = await Promise.all([
      fetchSetRowsForAnalytics(auth.userId, range),
      fetchWorkoutDatesInRange(auth.userId, range),
      fetchAllWorkoutDates(auth.userId),
    ]);

    return {
      data: buildWorkoutAnalytics(setRows, datesInRange, allDates),
    };
  } catch {
    return { error: "Could not load workout analytics.", data: null };
  }
}

export async function fetchBodyAnalytics(
  preset: DateRangePreset,
  custom?: { from?: string; to?: string },
): Promise<{ data: BodyAnalyticsSummary } | { error: string; data: null }> {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, data: null };
  }

  try {
    const range = getDateRange(preset, custom);
    const measurements = await listBodyMeasurementsInRange(
      auth.userId,
      range,
    );
    return { data: buildBodyAnalytics(measurements, range) };
  } catch {
    return { error: "Could not load body analytics.", data: null };
  }
}

export async function fetchExerciseProgress(
  exerciseId: string,
  preset: DateRangePreset,
  custom?: { from?: string; to?: string },
): Promise<
  { data: ExerciseProgressSummary } | { error: string; data: null }
> {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, data: null };
  }

  try {
    const range = getDateRange(preset, custom);
    const setRows = await fetchSetRowsForAnalytics(auth.userId, range);
    const name =
      setRows.find((r) => r.exerciseId === exerciseId)?.exerciseName ??
      "Exercise";

    return {
      data: buildExerciseProgress(setRows, exerciseId, name, range),
    };
  } catch {
    return { error: "Could not load exercise progress.", data: null };
  }
}

export async function fetchExerciseOptions(): Promise<
  { exercises: ExerciseOption[] } | { error: string; exercises: [] }
> {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, exercises: [] };
  }

  try {
    const exercises = await fetchExercisesUsedByUser(auth.userId);
    return { exercises };
  } catch {
    return { error: "Could not load exercises.", exercises: [] };
  }
}
