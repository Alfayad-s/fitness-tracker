"use client";

import {
  enqueueWorkoutSave,
  isLikelyOffline,
  isNetworkError,
} from "@/lib/offline/workout-save-queue";
import { saveCompletedWorkout } from "@/services/workout-actions";
import type { Feeling, WorkoutSession } from "@/types";

export type CompleteWorkoutClientResult =
  | { status: "saved"; workoutId: string }
  | { status: "queued"; queueId: string }
  | { status: "error"; error: string };

export async function completeWorkoutWithOfflineSupport(
  session: WorkoutSession,
  feeling: Feeling | null,
): Promise<CompleteWorkoutClientResult> {
  const endedSession: WorkoutSession = {
    ...session,
    feeling,
    endedAt: new Date().toISOString(),
  };

  if (isLikelyOffline()) {
    const item = enqueueWorkoutSave(endedSession, feeling);
    return { status: "queued", queueId: item.id };
  }

  try {
    const result = await saveCompletedWorkout(endedSession, feeling);

    if ("success" in result && result.success) {
      return { status: "saved", workoutId: result.workoutId };
    }

    const error =
      "error" in result ? result.error : "Could not save workout.";

    if (
      error.toLowerCase().includes("network") ||
      error.toLowerCase().includes("fetch")
    ) {
      const item = enqueueWorkoutSave(endedSession, feeling);
      return { status: "queued", queueId: item.id };
    }

    return { status: "error", error };
  } catch (err) {
    if (isLikelyOffline() || isNetworkError(err)) {
      const item = enqueueWorkoutSave(endedSession, feeling);
      return { status: "queued", queueId: item.id };
    }
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Could not save workout.",
    };
  }
}
