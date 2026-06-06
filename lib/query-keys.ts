import type { DateRangePreset } from "@/lib/analytics/date-range";

/** Analytics responses change slowly — avoid refetching on every tab switch. */
export const ANALYTICS_STALE_TIME_MS = 5 * 60 * 1000;

export type AnalyticsCustomRange = {
  from?: string;
  to?: string;
};

export const queryKeys = {
  workouts: {
    all: ["workouts"] as const,
    lists: () => [...queryKeys.workouts.all, "list"] as const,
    list: () => [...queryKeys.workouts.lists()] as const,
    details: () => [...queryKeys.workouts.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.workouts.details(), id] as const,
  },
  exercises: {
    all: ["exercises"] as const,
    searches: () => [...queryKeys.exercises.all, "search"] as const,
    search: (query: string, muscleGroup?: string) =>
      [
        ...queryKeys.exercises.searches(),
        { query, muscleGroup: muscleGroup ?? "all" },
      ] as const,
  },
  bodyMeasurements: {
    all: ["bodyMeasurements"] as const,
    lists: () => [...queryKeys.bodyMeasurements.all, "list"] as const,
    list: () => [...queryKeys.bodyMeasurements.lists()] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    workout: (preset: DateRangePreset, custom: AnalyticsCustomRange) =>
      [
        ...queryKeys.analytics.all,
        "workout",
        preset,
        custom.from ?? "",
        custom.to ?? "",
      ] as const,
    body: (preset: DateRangePreset, custom: AnalyticsCustomRange) =>
      [
        ...queryKeys.analytics.all,
        "body",
        preset,
        custom.from ?? "",
        custom.to ?? "",
      ] as const,
    exerciseOptions: () =>
      [...queryKeys.analytics.all, "exerciseOptions"] as const,
    exerciseProgress: (
      exerciseId: string,
      preset: DateRangePreset,
      custom: AnalyticsCustomRange,
    ) =>
      [
        ...queryKeys.analytics.all,
        "exerciseProgress",
        exerciseId,
        preset,
        custom.from ?? "",
        custom.to ?? "",
      ] as const,
  },
} as const;
