import type { Feeling } from "@/types/index";

/** Session lifecycle: idle → active ⇄ paused → completed | discarded */
export type WorkoutSessionStatus =
  | "idle"
  | "active"
  | "paused"
  | "completed"
  | "discarded";

export type RestTimerStatus = "idle" | "running" | "completed";

/** Client-generated id (crypto.randomUUID) before DB persist. */
export type ClientId = string;

export type SessionSet = {
  id: ClientId;
  reps: number | null;
  weightKg: number | null;
  rpe: number | null;
  restSeconds: number | null;
  isWarmup: boolean;
  completedAt: string | null;
};

export type SessionExercise = {
  id: ClientId;
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string | null;
  orderIndex: number;
  sets: SessionSet[];
};

export type RestTimer = {
  status: RestTimerStatus;
  startedAt: string | null;
  durationSeconds: number;
  setId: ClientId | null;
  exerciseId: ClientId | null;
};

export type WorkoutSession = {
  id: ClientId;
  status: Exclude<WorkoutSessionStatus, "idle">;
  userId: string;
  title: string;
  date: string;
  notes: string | null;
  feeling: Feeling | null;
  startedAt: string;
  endedAt: string | null;
  pausedAt: string | null;
  totalPausedMs: number;
  exercises: SessionExercise[];
  restTimer: RestTimer;
};

export const WORKOUT_SESSION_TRANSITIONS: Record<
  WorkoutSessionStatus,
  readonly WorkoutSessionStatus[]
> = {
  idle: ["active"],
  active: ["paused", "completed", "discarded"],
  paused: ["active", "completed", "discarded"],
  completed: [],
  discarded: [],
};

export function canTransitionWorkoutSession(
  from: WorkoutSessionStatus,
  to: WorkoutSessionStatus,
): boolean {
  return WORKOUT_SESSION_TRANSITIONS[from].includes(to);
}

export function isWorkoutSessionInProgress(
  status: WorkoutSessionStatus,
): boolean {
  return status === "active" || status === "paused";
}

export function getWorkoutSessionStatus(
  session: WorkoutSession | null,
): WorkoutSessionStatus {
  return session?.status ?? "idle";
}

export function createDefaultRestTimer(): RestTimer {
  return {
    status: "idle",
    startedAt: null,
    durationSeconds: 90,
    setId: null,
    exerciseId: null,
  };
}

export function createEmptySet(): SessionSet {
  return {
    id: crypto.randomUUID(),
    reps: null,
    weightKg: null,
    rpe: null,
    restSeconds: 90,
    isWarmup: false,
    completedAt: null,
  };
}

export type StartWorkoutInput = {
  userId: string;
  title: string;
  date: string;
  notes?: string | null;
  /** Pre-seeded exercises when starting from a template or daily plan. */
  exercises?: SessionExercise[];
};

export type CompleteWorkoutInput = {
  feeling?: Feeling | null;
};
