"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchWorkoutHistory } from "@/services/workout-actions";

export function useWorkouts() {
  return useQuery({
    queryKey: queryKeys.workouts.list(),
    queryFn: async () => {
      const result = await fetchWorkoutHistory();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.workouts;
    },
  });
}
