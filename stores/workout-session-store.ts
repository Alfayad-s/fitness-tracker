"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  defaultSessionReducerDeps,
  workoutSessionReducer,
  type WorkoutSessionAction,
} from "@/lib/workout/session-reducer";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
  type ClientId,
  type CompleteWorkoutInput,
  type RestTimer,
  type SessionExercise,
  type SessionSet,
  type StartWorkoutInput,
  type WorkoutSession,
  type WorkoutSessionStatus,
} from "@/types/workout-session";

const STORAGE_KEY = "fitness-tracker-workout-session";

type WorkoutSessionStore = {
  session: WorkoutSession | null;

  getStatus: () => WorkoutSessionStatus;
  startWorkout: (input: StartWorkoutInput) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  completeWorkout: (input?: CompleteWorkoutInput) => void;
  discardWorkout: () => void;
  clearSession: () => void;

  updateWorkoutMeta: (
    patch: Partial<Pick<WorkoutSession, "title" | "date" | "notes">>,
  ) => void;

  addExercise: (
    exercise: Omit<SessionExercise, "id" | "orderIndex" | "sets">,
  ) => ClientId;
  removeExercise: (exerciseId: ClientId) => void;
  reorderExercises: (orderedIds: ClientId[]) => void;

  addSet: (exerciseId: ClientId, set?: Partial<SessionSet>) => ClientId;
  updateSet: (
    exerciseId: ClientId,
    setId: ClientId,
    patch: Partial<SessionSet>,
  ) => void;
  removeSet: (exerciseId: ClientId, setId: ClientId) => void;
  duplicateSet: (exerciseId: ClientId, setId: ClientId) => ClientId | null;

  startRestTimer: (
    durationSeconds: number,
    ctx?: { exerciseId?: ClientId; setId?: ClientId },
  ) => void;
  completeRestTimer: () => void;
  cancelRestTimer: () => void;
};

function dispatch(
  get: () => WorkoutSessionStore,
  set: (partial: Partial<WorkoutSessionStore>) => void,
  action: WorkoutSessionAction,
): ClientId | null | undefined {
  const result = workoutSessionReducer(get().session, action);
  set({ session: result.session });
  return result.exerciseId ?? result.setId ?? null;
}

export const useWorkoutSessionStore = create<WorkoutSessionStore>()(
  persist(
    (set, get) => ({
      session: null,

      getStatus: () => getWorkoutSessionStatus(get().session),

      startWorkout: (input) => {
        dispatch(get, set, { type: "START", input });
      },

      pauseWorkout: () => {
        dispatch(get, set, { type: "PAUSE" });
      },

      resumeWorkout: () => {
        dispatch(get, set, { type: "RESUME" });
      },

      completeWorkout: (input) => {
        dispatch(get, set, { type: "COMPLETE", input });
      },

      discardWorkout: () => {
        dispatch(get, set, { type: "DISCARD" });
      },

      clearSession: () => {
        dispatch(get, set, { type: "CLEAR" });
      },

      updateWorkoutMeta: (patch) => {
        dispatch(get, set, { type: "UPDATE_META", patch });
      },

      addExercise: (exercise) => {
        const id = dispatch(get, set, { type: "ADD_EXERCISE", exercise });
        if (!id) throw new Error("Failed to add exercise");
        return id;
      },

      removeExercise: (exerciseId) => {
        dispatch(get, set, { type: "REMOVE_EXERCISE", exerciseId });
      },

      reorderExercises: (orderedIds) => {
        dispatch(get, set, { type: "REORDER_EXERCISES", orderedIds });
      },

      addSet: (exerciseId, partial) => {
        const id = dispatch(get, set, {
          type: "ADD_SET",
          exerciseId,
          partial,
        });
        if (!id) throw new Error("Failed to add set");
        return id;
      },

      updateSet: (exerciseId, setId, patch) => {
        dispatch(get, set, {
          type: "UPDATE_SET",
          exerciseId,
          setId,
          patch,
        });
      },

      removeSet: (exerciseId, setId) => {
        dispatch(get, set, { type: "REMOVE_SET", exerciseId, setId });
      },

      duplicateSet: (exerciseId, setId) => {
        const id = dispatch(get, set, {
          type: "DUPLICATE_SET",
          exerciseId,
          setId,
        });
        return id ?? null;
      },

      startRestTimer: (durationSeconds, ctx) => {
        dispatch(get, set, {
          type: "START_REST_TIMER",
          durationSeconds,
          ctx,
        });
      },

      completeRestTimer: () => {
        dispatch(get, set, { type: "COMPLETE_REST_TIMER" });
      },

      cancelRestTimer: () => {
        dispatch(get, set, { type: "CANCEL_REST_TIMER" });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => {
        const { session } = state;
        if (session && isWorkoutSessionInProgress(session.status)) {
          return { session };
        }
        return { session: null };
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkoutSessionStore> | undefined;
        const session = p?.session ?? null;
        if (session && isWorkoutSessionInProgress(session.status)) {
          return { ...current, session };
        }
        return { ...current, session: null };
      },
    },
  ),
);

/** Elapsed active workout time in ms (excludes paused time). */
export function getActiveWorkoutElapsedMs(session: WorkoutSession): number {
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  const start = new Date(session.startedAt).getTime();
  let pausedMs = session.totalPausedMs;

  if (session.status === "paused" && session.pausedAt) {
    pausedMs += Date.now() - new Date(session.pausedAt).getTime();
  }

  return Math.max(0, end - start - pausedMs);
}

/** Remaining rest seconds from a running timer (0 if elapsed). */
export function getRestTimerRemainingSeconds(timer: RestTimer): number {
  if (timer.status !== "running" || !timer.startedAt) return 0;
  const elapsed = (Date.now() - new Date(timer.startedAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(timer.durationSeconds - elapsed));
}
