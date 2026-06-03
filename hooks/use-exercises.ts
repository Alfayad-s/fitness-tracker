"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchExercises } from "@/services/workout-actions";

type UseExercisesOptions = {
  query?: string;
  muscleGroup?: string;
  enabled?: boolean;
};

export function useExercises({
  query = "",
  muscleGroup = "all",
  enabled = true,
}: UseExercisesOptions = {}) {
  return useQuery({
    queryKey: queryKeys.exercises.search(query, muscleGroup),
    queryFn: async () => {
      const result = await fetchExercises(query, muscleGroup);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.exercises;
    },
    enabled,
  });
}
