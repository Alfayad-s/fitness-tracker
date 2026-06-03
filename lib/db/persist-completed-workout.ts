import { db } from "@/lib/db";
import { sets, workoutExercises, workouts } from "@/lib/db/schema";
import type { SaveWorkoutSessionInput } from "@/types/schemas/workout";
import type { SessionSet } from "@/types";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function computeWorkoutDurationSeconds(
  session: SaveWorkoutSessionInput,
): number {
  const endMs = session.endedAt
    ? new Date(session.endedAt).getTime()
    : Date.now();
  const startMs = new Date(session.startedAt).getTime();
  const pausedMs = session.totalPausedMs;
  return Math.max(0, Math.round((endMs - startMs - pausedMs) / 1000));
}

export function isSetLogged(set: SessionSet): boolean {
  return (
    (set.reps != null && set.reps > 0) ||
    (set.weightKg != null && set.weightKg > 0)
  );
}

export async function insertWorkoutExercisesAndSets(
  tx: DbTransaction,
  workoutId: string,
  data: SaveWorkoutSessionInput,
): Promise<void> {
  for (const ex of data.exercises) {
    const [we] = await tx
      .insert(workoutExercises)
      .values({
        workoutId,
        exerciseId: ex.exerciseId,
        orderIndex: ex.orderIndex,
      })
      .returning({ id: workoutExercises.id });

    const loggedSets = ex.sets.filter(isSetLogged);
    if (loggedSets.length === 0) continue;

    await tx.insert(sets).values(
      loggedSets.map((s) => ({
        workoutExerciseId: we.id,
        reps: s.reps,
        weightKg: s.weightKg != null ? String(s.weightKg) : null,
        rpe: s.rpe,
        restSeconds: s.restSeconds,
        isWarmup: s.isWarmup,
      })),
    );
  }
}

export async function persistCompletedWorkout(
  tx: DbTransaction,
  userId: string,
  data: SaveWorkoutSessionInput,
): Promise<string> {
  const duration = computeWorkoutDurationSeconds(data);

  const [workout] = await tx
    .insert(workouts)
    .values({
      userId,
      title: data.title,
      date: data.date,
      startTime: new Date(data.startedAt),
      endTime: new Date(data.endedAt!),
      feeling: data.feeling,
      duration,
    })
    .returning({ id: workouts.id });

  await insertWorkoutExercisesAndSets(tx, workout.id, data);

  return workout.id;
}
