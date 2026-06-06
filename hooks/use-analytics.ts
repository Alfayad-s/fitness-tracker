"use client";

import { useQuery } from "@tanstack/react-query";

import type { DateRangePreset } from "@/lib/analytics/date-range";
import {
  ANALYTICS_STALE_TIME_MS,
  queryKeys,
  type AnalyticsCustomRange,
} from "@/lib/query-keys";
import {
  fetchBodyAnalytics,
  fetchExerciseOptions,
  fetchExerciseProgress,
  fetchWorkoutAnalytics,
} from "@/services/analytics-actions";
import { fetchMeasurementHistory } from "@/services/measurement-actions";
import type {
  BodyAnalyticsSummary,
  ExerciseOption,
  ExerciseProgressSummary,
  WorkoutAnalyticsSummary,
} from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

export function useWorkoutAnalytics(
  preset: DateRangePreset,
  custom: AnalyticsCustomRange,
  initialData?: WorkoutAnalyticsSummary,
) {
  return useQuery({
    queryKey: queryKeys.analytics.workout(preset, custom),
    queryFn: async () => {
      const result = await fetchWorkoutAnalytics(preset, custom);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Could not load workout analytics.");
      }
      return result.data;
    },
    staleTime: ANALYTICS_STALE_TIME_MS,
    initialData,
  });
}

export function useBodyAnalytics(
  preset: DateRangePreset,
  custom: AnalyticsCustomRange,
  initialData?: BodyAnalyticsSummary,
) {
  return useQuery({
    queryKey: queryKeys.analytics.body(preset, custom),
    queryFn: async () => {
      const result = await fetchBodyAnalytics(preset, custom);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Could not load body analytics.");
      }
      return result.data;
    },
    staleTime: ANALYTICS_STALE_TIME_MS,
    initialData,
  });
}

export function useExerciseOptions(initialExercises?: ExerciseOption[]) {
  return useQuery({
    queryKey: queryKeys.analytics.exerciseOptions(),
    queryFn: async () => {
      const result = await fetchExerciseOptions();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.exercises;
    },
    staleTime: ANALYTICS_STALE_TIME_MS,
    initialData: initialExercises,
  });
}

export function useExerciseProgressAnalytics(
  exerciseId: string,
  preset: DateRangePreset,
  custom: AnalyticsCustomRange,
  initialData?: ExerciseProgressSummary | null,
) {
  return useQuery({
    queryKey: queryKeys.analytics.exerciseProgress(exerciseId, preset, custom),
    queryFn: async () => {
      const result = await fetchExerciseProgress(exerciseId, preset, custom);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Could not load exercise progress.");
      }
      return result.data;
    },
    enabled: Boolean(exerciseId),
    staleTime: ANALYTICS_STALE_TIME_MS,
    initialData: initialData ?? undefined,
  });
}

export function useMeasurementHistory(initialMeasurements?: BodyMeasurement[]) {
  return useQuery({
    queryKey: queryKeys.bodyMeasurements.list(),
    queryFn: async () => {
      const result = await fetchMeasurementHistory();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.measurements;
    },
    staleTime: ANALYTICS_STALE_TIME_MS,
    initialData: initialMeasurements,
  });
}
