import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db/with-db";
import {
  exercises,
  sets,
  workoutExercises,
  workouts,
} from "@/lib/db/schema";
import type { Exercise, Set, Workout, WorkoutExercise } from "@/types";

export type WorkoutListItem = Workout & {
  exerciseCount: number;
  setCount: number;
};

export type WorkoutDetailExercise = WorkoutExercise & {
  exercise: Exercise;
  sets: Set[];
};

export type WorkoutDetail = Workout & {
  workoutExercises: WorkoutDetailExercise[];
};

export type ListWorkoutsResult = {
  workouts: WorkoutListItem[];
  dbUnavailable: boolean;
};

export async function listWorkoutsByUser(
  userId: string,
  options?: { limit?: number; offset?: number },
): Promise<ListWorkoutsResult> {
  return withDbFallback<ListWorkoutsResult>(
    "listWorkoutsByUser",
    async () => {
      const limit = options?.limit ?? 30;
      const offset = options?.offset ?? 0;

      const rows = await db
        .select({
          workout: workouts,
          exerciseCount: sql<number>`count(distinct ${workoutExercises.id})::int`,
          setCount: sql<number>`count(${sets.id})::int`,
        })
        .from(workouts)
        .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
        .leftJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
        .where(eq(workouts.userId, userId))
        .groupBy(workouts.id)
        .orderBy(desc(workouts.date), desc(workouts.startTime))
        .limit(limit)
        .offset(offset);

      return {
        dbUnavailable: false,
        workouts: rows.map((row) => ({
          ...row.workout,
          exerciseCount: row.exerciseCount ?? 0,
          setCount: row.setCount ?? 0,
        })),
      };
    },
    { workouts: [], dbUnavailable: true },
  );
}

export async function getWorkoutDetail(
  workoutId: string,
  userId: string,
): Promise<WorkoutDetail | null> {
  return withDbFallback(
    "getWorkoutDetail",
    async () => fetchWorkoutDetail(workoutId, userId),
    null,
  );
}

async function fetchWorkoutDetail(
  workoutId: string,
  userId: string,
): Promise<WorkoutDetail | null> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  if (!workout) return null;

  const weRows = await db
    .select({
      workoutExercise: workoutExercises,
      exercise: exercises,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(workoutExercises.orderIndex);

  const weIds = weRows.map((r) => r.workoutExercise.id);
  const setRows =
    weIds.length > 0
      ? await db.select().from(sets).where(inArray(sets.workoutExerciseId, weIds))
      : [];

  const setsByWe = new Map<string, Set[]>();
  for (const s of setRows) {
    const list = setsByWe.get(s.workoutExerciseId) ?? [];
    list.push(s);
    setsByWe.set(s.workoutExerciseId, list);
  }

  return {
    ...workout,
    workoutExercises: weRows.map((row) => ({
      ...row.workoutExercise,
      exercise: row.exercise,
      sets: setsByWe.get(row.workoutExercise.id) ?? [],
    })),
  };
}

export async function deleteWorkoutForUser(
  workoutId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning({ id: workouts.id });

  return result.length > 0;
}
