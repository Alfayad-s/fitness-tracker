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
} as const;
