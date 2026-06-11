import { and, countDistinct, desc, eq, gte, lte } from "drizzle-orm";

import type { DateRange } from "@/lib/analytics/date-range";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db/with-db";
import {
  exercises,
  sets,
  workoutExercises,
  workouts,
} from "@/lib/db/schema";

export type SetRowForAnalytics = {
  workoutDate: string;
  exerciseId: string;
  exerciseName: string;
  reps: number | null;
  weightKg: number | null;
  isWarmup: boolean;
};

export async function fetchSetRowsForAnalytics(
  userId: string,
  range: DateRange,
): Promise<SetRowForAnalytics[]> {
  return withDbFallback(
    "fetchSetRowsForAnalytics",
    async () => fetchSetRowsForAnalyticsQuery(userId, range),
    [],
  );
}

async function fetchSetRowsForAnalyticsQuery(
  userId: string,
  range: DateRange,
): Promise<SetRowForAnalytics[]> {
  const rows = await db
    .select({
      workoutDate: workouts.date,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      reps: sets.reps,
      weightKg: sets.weightKg,
      isWarmup: sets.isWarmup,
    })
    .from(sets)
    .innerJoin(
      workoutExercises,
      eq(sets.workoutExerciseId, workoutExercises.id),
    )
    .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.date, range.from),
        lte(workouts.date, range.to),
      ),
    );

  return rows.map((r) => ({
    workoutDate: r.workoutDate,
    exerciseId: r.exerciseId,
    exerciseName: r.exerciseName,
    reps: r.reps,
    weightKg: r.weightKg != null ? Number(r.weightKg) : null,
    isWarmup: r.isWarmup,
  }));
}

export async function fetchWorkoutDatesInRange(
  userId: string,
  range: DateRange,
): Promise<string[]> {
  return withDbFallback(
    "fetchWorkoutDatesInRange",
    async () => {
      const rows = await db
        .select({ date: workouts.date })
        .from(workouts)
        .where(
          and(
            eq(workouts.userId, userId),
            gte(workouts.date, range.from),
            lte(workouts.date, range.to),
          ),
        )
        .orderBy(workouts.date);

      return rows.map((r) => r.date);
    },
    [],
  );
}

/** Recent distinct workout dates (newest first) — enough for current streak without scanning full history. */
export async function fetchRecentWorkoutDatesForStreak(
  userId: string,
  limit = 400,
): Promise<string[]> {
  return withDbFallback(
    "fetchRecentWorkoutDatesForStreak",
    async () => {
      const rows = await db
        .select({ date: workouts.date })
        .from(workouts)
        .where(eq(workouts.userId, userId))
        .orderBy(desc(workouts.date))
        .limit(limit);

      return [...new Set(rows.map((r) => r.date))];
    },
    [],
  );
}

/** Distinct workout days logged — cheap alternative to loading every date row. */
export async function fetchWorkoutSessionCount(userId: string): Promise<number> {
  return withDbFallback(
    "fetchWorkoutSessionCount",
    async () => {
      const [row] = await db
        .select({ count: countDistinct(workouts.date) })
        .from(workouts)
        .where(eq(workouts.userId, userId));

      return Number(row?.count ?? 0);
    },
    0,
  );
}

export async function fetchAllWorkoutDates(userId: string): Promise<string[]> {
  return withDbFallback(
    "fetchAllWorkoutDates",
    async () => {
      const rows = await db
        .select({ date: workouts.date })
        .from(workouts)
        .where(eq(workouts.userId, userId))
        .orderBy(desc(workouts.date));

      return rows.map((r) => r.date);
    },
    [],
  );
}

export async function fetchExercisesUsedByUser(
  userId: string,
): Promise<{ id: string; name: string }[]> {
  return withDbFallback(
    "fetchExercisesUsedByUser",
    async () => {
      const rows = await db
        .selectDistinct({
          id: exercises.id,
          name: exercises.name,
        })
        .from(exercises)
        .innerJoin(
          workoutExercises,
          eq(workoutExercises.exerciseId, exercises.id),
        )
        .innerJoin(workouts, eq(workoutExercises.workoutId, workouts.id))
        .where(eq(workouts.userId, userId))
        .orderBy(exercises.name);

      return rows;
    },
    [],
  );
}

