import {
  canTransitionWorkoutSession,
  createDefaultRestTimer,
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

export type SessionReducerDeps = {
  nowIso: () => string;
  nowMs: () => number;
  createId: () => string;
};

export const defaultSessionReducerDeps: SessionReducerDeps = {
  nowIso: () => new Date().toISOString(),
  nowMs: () => Date.now(),
  createId: () => crypto.randomUUID(),
};

function createEmptySetWithId(createId: () => string): SessionSet {
  return {
    id: createId(),
    reps: null,
    weightKg: null,
    rpe: null,
    restSeconds: 90,
    isWarmup: false,
    completedAt: null,
  };
}

function assertTransition(
  session: WorkoutSession | null,
  to: WorkoutSessionStatus,
): asserts session is WorkoutSession {
  const from = getWorkoutSessionStatus(session);
  if (!session || !canTransitionWorkoutSession(from, to)) {
    throw new Error(`Invalid workout session transition: ${from} → ${to}`);
  }
}

function mapExercises(
  session: WorkoutSession,
  mapper: (exercises: SessionExercise[]) => SessionExercise[],
): WorkoutSession {
  return { ...session, exercises: mapper(session.exercises) };
}

function findExercise(session: WorkoutSession, exerciseId: ClientId) {
  return session.exercises.find((e) => e.id === exerciseId);
}

export type WorkoutSessionAction =
  | { type: "START"; input: StartWorkoutInput }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "COMPLETE"; input?: CompleteWorkoutInput }
  | { type: "DISCARD" }
  | { type: "CLEAR" }
  | {
      type: "UPDATE_META";
      patch: Partial<Pick<WorkoutSession, "title" | "date" | "notes">>;
    }
  | {
      type: "ADD_EXERCISE";
      exercise: Omit<SessionExercise, "id" | "orderIndex" | "sets">;
    }
  | { type: "REMOVE_EXERCISE"; exerciseId: ClientId }
  | { type: "REORDER_EXERCISES"; orderedIds: ClientId[] }
  | {
      type: "ADD_SET";
      exerciseId: ClientId;
      partial?: Partial<SessionSet>;
    }
  | {
      type: "UPDATE_SET";
      exerciseId: ClientId;
      setId: ClientId;
      patch: Partial<SessionSet>;
    }
  | { type: "REMOVE_SET"; exerciseId: ClientId; setId: ClientId }
  | { type: "DUPLICATE_SET"; exerciseId: ClientId; setId: ClientId }
  | {
      type: "START_REST_TIMER";
      durationSeconds: number;
      ctx?: { exerciseId?: ClientId; setId?: ClientId };
    }
  | { type: "COMPLETE_REST_TIMER" }
  | { type: "CANCEL_REST_TIMER" };

export type WorkoutSessionReducerResult =
  | { session: WorkoutSession | null; exerciseId?: ClientId; setId?: ClientId };

export function workoutSessionReducer(
  session: WorkoutSession | null,
  action: WorkoutSessionAction,
  deps: SessionReducerDeps = defaultSessionReducerDeps,
): WorkoutSessionReducerResult {
  switch (action.type) {
    case "START": {
      const from = getWorkoutSessionStatus(session);
      if (from !== "idle" && !canTransitionWorkoutSession(from, "active")) {
        throw new Error(`Cannot start workout while status is ${from}`);
      }
      const next: WorkoutSession = {
        id: deps.createId(),
        status: "active",
        userId: action.input.userId,
        title: action.input.title.trim(),
        date: action.input.date,
        notes: action.input.notes?.trim() || null,
        feeling: null,
        startedAt: deps.nowIso(),
        endedAt: null,
        pausedAt: null,
        totalPausedMs: 0,
        exercises: action.input.exercises ?? [],
        restTimer: createDefaultRestTimer(),
      };
      return { session: next };
    }

    case "PAUSE": {
      assertTransition(session, "paused");
      return {
        session: {
          ...session,
          status: "paused",
          pausedAt: deps.nowIso(),
          restTimer: {
            ...session.restTimer,
            status: "idle",
            startedAt: null,
          },
        },
      };
    }

    case "RESUME": {
      assertTransition(session, "active");
      let totalPausedMs = session.totalPausedMs;
      if (session.pausedAt) {
        totalPausedMs += deps.nowMs() - new Date(session.pausedAt).getTime();
      }
      return {
        session: {
          ...session,
          status: "active",
          pausedAt: null,
          totalPausedMs,
        },
      };
    }

    case "COMPLETE": {
      assertTransition(session, "completed");
      return {
        session: {
          ...session,
          status: "completed",
          feeling: action.input?.feeling ?? session.feeling,
          endedAt: deps.nowIso(),
          pausedAt: null,
          restTimer: createDefaultRestTimer(),
        },
      };
    }

    case "DISCARD": {
      const from = getWorkoutSessionStatus(session);
      if (from === "idle") return { session: null };
      if (session && !canTransitionWorkoutSession(from, "discarded")) {
        throw new Error(`Cannot discard workout while status is ${from}`);
      }
      return { session: null };
    }

    case "CLEAR":
      return { session: null };

    case "UPDATE_META": {
      if (!session || !isWorkoutSessionInProgress(session.status)) {
        return { session };
      }
      const { patch } = action;
      return {
        session: {
          ...session,
          ...patch,
          title: patch.title?.trim() ?? session.title,
          notes:
            patch.notes !== undefined
              ? patch.notes?.trim() || null
              : session.notes,
        },
      };
    }

    case "ADD_EXERCISE": {
      if (!session || session.status !== "active") {
        throw new Error("Add exercises only while the workout is active");
      }
      const id = deps.createId();
      const entry: SessionExercise = {
        id,
        exerciseId: action.exercise.exerciseId,
        name: action.exercise.name,
        category: action.exercise.category,
        muscleGroup: action.exercise.muscleGroup,
        equipment: action.exercise.equipment,
        orderIndex: session.exercises.length,
        sets: [createEmptySetWithId(deps.createId)],
      };
      return {
        session: { ...session, exercises: [...session.exercises, entry] },
        exerciseId: id,
      };
    }

    case "REMOVE_EXERCISE": {
      if (!session || !isWorkoutSessionInProgress(session.status)) {
        return { session };
      }
      const exercises = session.exercises
        .filter((e) => e.id !== action.exerciseId)
        .map((e, index) => ({ ...e, orderIndex: index }));
      return { session: { ...session, exercises } };
    }

    case "REORDER_EXERCISES": {
      if (!session || !isWorkoutSessionInProgress(session.status)) {
        return { session };
      }
      const byId = new Map(session.exercises.map((e) => [e.id, e]));
      const exercises = action.orderedIds
        .map((id, index) => {
          const ex = byId.get(id);
          return ex ? { ...ex, orderIndex: index } : null;
        })
        .filter((e): e is SessionExercise => e !== null);
      if (exercises.length !== session.exercises.length) {
        return { session };
      }
      return { session: { ...session, exercises } };
    }

    case "ADD_SET": {
      if (!session || session.status !== "active") {
        throw new Error("Add sets only while the workout is active");
      }
      const setId = deps.createId();
      const newSet: SessionSet = {
        ...createEmptySetWithId(deps.createId),
        ...action.partial,
        id: setId,
      };
      return {
        session: mapExercises(session, (exercises) =>
          exercises.map((ex) =>
            ex.id === action.exerciseId
              ? { ...ex, sets: [...ex.sets, newSet] }
              : ex,
          ),
        ),
        setId,
      };
    }

    case "UPDATE_SET": {
      if (!session || !isWorkoutSessionInProgress(session.status)) {
        return { session };
      }
      return {
        session: mapExercises(session, (exercises) =>
          exercises.map((ex) =>
            ex.id !== action.exerciseId
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id === action.setId ? { ...s, ...action.patch } : s,
                  ),
                },
          ),
        ),
      };
    }

    case "REMOVE_SET": {
      if (!session || !isWorkoutSessionInProgress(session.status)) {
        return { session };
      }
      return {
        session: mapExercises(session, (exercises) =>
          exercises.map((ex) => {
            if (ex.id !== action.exerciseId) return ex;
            const nextSets = ex.sets.filter((s) => s.id !== action.setId);
            return {
              ...ex,
              sets:
                nextSets.length > 0
                  ? nextSets
                  : [createEmptySetWithId(deps.createId)],
            };
          }),
        ),
      };
    }

    case "DUPLICATE_SET": {
      if (!session || session.status !== "active") {
        return { session };
      }
      const ex = findExercise(session, action.exerciseId);
      const source = ex?.sets.find((s) => s.id === action.setId);
      if (!ex || !source) {
        return { session };
      }
      const newId = deps.createId();
      const clone: SessionSet = { ...source, id: newId, completedAt: null };
      return {
        session: mapExercises(session, (exercises) =>
          exercises.map((e) =>
            e.id === action.exerciseId
              ? { ...e, sets: [...e.sets, clone] }
              : e,
          ),
        ),
        setId: newId,
      };
    }

    case "START_REST_TIMER": {
      if (!session || session.status !== "active") {
        return { session };
      }
      const restTimer: RestTimer = {
        status: "running",
        startedAt: deps.nowIso(),
        durationSeconds: action.durationSeconds,
        exerciseId: action.ctx?.exerciseId ?? null,
        setId: action.ctx?.setId ?? null,
      };
      return { session: { ...session, restTimer } };
    }

    case "COMPLETE_REST_TIMER": {
      if (!session || session.restTimer.status !== "running") {
        return { session };
      }
      return {
        session: {
          ...session,
          restTimer: { ...session.restTimer, status: "completed" },
        },
      };
    }

    case "CANCEL_REST_TIMER": {
      if (!session) return { session };
      return { session: { ...session, restTimer: createDefaultRestTimer() } };
    }

    default:
      return { session };
  }
}
