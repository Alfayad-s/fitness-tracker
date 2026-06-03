"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createEmptySet } from "@/types/workout-session";
import type { ClientId, SessionExercise, SessionSet } from "@/types";
import type { SaveWorkoutSessionInput } from "@/types/schemas/workout";

export type WorkoutEditorApi = {
  exercises: SessionExercise[];
  disabled: boolean;
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
  sessionExerciseIds: Set<string>;
};

const WorkoutEditorContext = createContext<WorkoutEditorApi | null>(null);

export function useWorkoutEditor(): WorkoutEditorApi {
  const ctx = useContext(WorkoutEditorContext);
  if (!ctx) {
    throw new Error("useWorkoutEditor must be used within WorkoutEditorProvider");
  }
  return ctx;
}

export function useOptionalWorkoutEditor(): WorkoutEditorApi | null {
  return useContext(WorkoutEditorContext);
}

type WorkoutEditorProviderProps = {
  initial: SaveWorkoutSessionInput;
  disabled?: boolean;
  children: ReactNode;
  onExercisesChange?: (exercises: SessionExercise[]) => void;
};

export function WorkoutEditorProvider({
  initial,
  disabled = false,
  children,
  onExercisesChange,
}: WorkoutEditorProviderProps) {
  const [exercises, setExercises] = useState(initial.exercises);

  const emit = useCallback(
    (next: SessionExercise[]) => {
      setExercises(next);
      onExercisesChange?.(next);
    },
    [onExercisesChange],
  );

  const api = useMemo<WorkoutEditorApi>(() => {
    const sessionExerciseIds = new Set(exercises.map((e) => e.exerciseId));

    return {
      exercises,
      disabled,
      sessionExerciseIds,
      addExercise: (exercise) => {
        const id = crypto.randomUUID();
        const entry: SessionExercise = {
          id,
          ...exercise,
          orderIndex: exercises.length,
          sets: [createEmptySet()],
        };
        emit([...exercises, entry]);
        return id;
      },
      removeExercise: (exerciseId) => {
        const next = exercises
          .filter((e) => e.id !== exerciseId)
          .map((e, index) => ({ ...e, orderIndex: index }));
        emit(next);
      },
      reorderExercises: (orderedIds) => {
        const byId = new Map(exercises.map((e) => [e.id, e]));
        const next = orderedIds
          .map((id, index) => {
            const ex = byId.get(id);
            return ex ? { ...ex, orderIndex: index } : null;
          })
          .filter((e): e is SessionExercise => e !== null);
        if (next.length !== exercises.length) return;
        emit(next);
      },
      addSet: (exerciseId, partial) => {
        const setId = crypto.randomUUID();
        const newSet: SessionSet = {
          ...createEmptySet(),
          ...partial,
          id: setId,
        };
        emit(
          exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, sets: [...ex.sets, newSet] } : ex,
          ),
        );
        return setId;
      },
      updateSet: (exerciseId, setId, patch) => {
        emit(
          exercises.map((ex) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id === setId ? { ...s, ...patch } : s,
                  ),
                },
          ),
        );
      },
      removeSet: (exerciseId, setId) => {
        emit(
          exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const sets = ex.sets.filter((s) => s.id !== setId);
            return { ...ex, sets: sets.length > 0 ? sets : [createEmptySet()] };
          }),
        );
      },
      duplicateSet: (exerciseId, setId) => {
        const ex = exercises.find((e) => e.id === exerciseId);
        const source = ex?.sets.find((s) => s.id === setId);
        if (!ex || !source) return null;
        const newId = crypto.randomUUID();
        const clone: SessionSet = { ...source, id: newId, completedAt: null };
        emit(
          exercises.map((e) =>
            e.id === exerciseId ? { ...e, sets: [...e.sets, clone] } : e,
          ),
        );
        return newId;
      },
    };
  }, [exercises, disabled, emit]);

  return (
    <WorkoutEditorContext.Provider value={api}>
      {children}
    </WorkoutEditorContext.Provider>
  );
}
