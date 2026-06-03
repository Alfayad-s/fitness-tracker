"use client";

import {
  getQueuedWorkoutSaves,
  removeQueuedWorkoutSave,
} from "@/lib/offline/workout-save-queue";
import { saveCompletedWorkout } from "@/services/workout-actions";

export type FlushQueueResult = {
  synced: number;
  failed: number;
  lastWorkoutId?: string;
};

export async function flushWorkoutSaveQueue(): Promise<FlushQueueResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getQueuedWorkoutSaves();
  let synced = 0;
  let failed = 0;
  let lastWorkoutId: string | undefined;

  for (const item of queue) {
    const result = await saveCompletedWorkout(item.session, item.feeling);

    if ("success" in result && result.success) {
      removeQueuedWorkoutSave(item.id);
      synced += 1;
      lastWorkoutId = result.workoutId;
    } else {
      failed += 1;
    }
  }

  return { synced, failed, lastWorkoutId };
}
