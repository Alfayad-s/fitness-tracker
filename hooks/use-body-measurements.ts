"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { fetchMeasurementHistory } from "@/services/measurement-actions";

export function useBodyMeasurements() {
  return useQuery({
    queryKey: queryKeys.bodyMeasurements.list(),
    queryFn: async () => {
      const result = await fetchMeasurementHistory();
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.measurements;
    },
  });
}
