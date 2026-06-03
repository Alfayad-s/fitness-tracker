"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchWorkoutById } from "@/services/workout-actions";

export function useWorkout(workoutId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workouts.detail(workoutId ?? ""),
    queryFn: async () => {
      if (!workoutId) {
        throw new Error("Workout id is required.");
      }
      const result = await fetchWorkoutById(workoutId);
      if ("error" in result) {
        throw new Error(result.error);
      }
      if (!result.workout) {
        throw new Error("Workout not found.");
      }
      return result.workout;
    },
    enabled: Boolean(workoutId),
  });
}
