"use server";

import { revalidatePath } from "next/cache";

import {
  deleteWorkoutForUser,
  getWorkoutDetail,
  listWorkoutsByUser,
} from "@/lib/db/queries/workouts";
import { searchExercises } from "@/lib/db/queries/exercises";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  computeWorkoutDurationSeconds,
  insertWorkoutExercisesAndSets,
  persistCompletedWorkout,
} from "@/lib/db/persist-completed-workout";
import { workoutExercises, workouts } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import {
  saveWorkoutSessionSchema,
  updateWorkoutPayloadSchema,
  type UpdateWorkoutPayload,
} from "@/types/schemas/workout";
import type { WorkoutSession } from "@/types";

export async function fetchExercises(query: string, muscleGroup?: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." as const, exercises: [] };
  }

  try {
    const exercises = await searchExercises(user.id, query, muscleGroup);
    return { exercises };
  } catch {
    return { error: "Could not load exercises." as const, exercises: [] };
  }
}

export async function fetchWorkoutHistory() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." as const, workouts: [] };
  }

  const { workouts, dbUnavailable } = await listWorkoutsByUser(user.id);
  if (dbUnavailable) {
    return {
      error: "Could not load workouts. Check database connection." as const,
      workouts: [],
    };
  }
  return { workouts };
}

export async function fetchWorkoutById(workoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." as const, workout: null };
  }

  try {
    const workout = await getWorkoutDetail(workoutId, user.id);
    if (!workout) {
      return { error: "Workout not found." as const, workout: null };
    }
    return { workout };
  } catch {
    return { error: "Could not load workout." as const, workout: null };
  }
}

export async function saveCompletedWorkout(
  session: WorkoutSession,
  feeling: WorkoutSession["feeling"],
): Promise<{ success: true; workoutId: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to save a workout." };
  }

  if (session.userId !== user.id) {
    return { error: "Session does not match your account." };
  }

  const payload = saveWorkoutSessionSchema.safeParse({
    ...session,
    feeling: feeling ?? session.feeling,
    endedAt: session.endedAt ?? new Date().toISOString(),
  });

  if (!payload.success) {
    return { error: "Invalid workout data. Check your sets and try again." };
  }

  const data = payload.data;

  if (data.exercises.length === 0) {
    return { error: "Add at least one exercise before finishing." };
  }

  try {
    const workoutId = await db.transaction(async (tx) =>
      persistCompletedWorkout(tx, user.id, data),
    );

    revalidatePath("/workouts");
    revalidatePath("/dashboard");

    return { success: true, workoutId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not save workout.";
    return { error: message };
  }
}

export async function updateCompletedWorkout(
  payload: UpdateWorkoutPayload,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be signed in to update a workout." };
  }

  const parsed = updateWorkoutPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return { error: "Invalid workout data. Check your sets and try again." };
  }

  const { workoutId, ...sessionFields } = parsed.data;

  if (sessionFields.userId !== user.id) {
    return { error: "Workout does not match your account." };
  }

  if (sessionFields.exercises.length === 0) {
    return { error: "Add at least one exercise." };
  }

  const duration = computeWorkoutDurationSeconds(sessionFields);

  try {
    const updated = await db.transaction(async (tx) => {
      const [workout] = await tx
        .update(workouts)
        .set({
          title: sessionFields.title,
          date: sessionFields.date,
          feeling: sessionFields.feeling,
          duration,
          endTime: sessionFields.endedAt
            ? new Date(sessionFields.endedAt)
            : undefined,
        })
        .where(
          and(eq(workouts.id, workoutId), eq(workouts.userId, user.id)),
        )
        .returning({ id: workouts.id });

      if (!workout) return null;

      await tx
        .delete(workoutExercises)
        .where(eq(workoutExercises.workoutId, workoutId));

      await insertWorkoutExercisesAndSets(tx, workoutId, sessionFields);

      return workout;
    });

    if (!updated) {
      return { error: "Workout not found." };
    }

    revalidatePath("/workouts");
    revalidatePath("/dashboard");
    revalidatePath(`/workouts/${workoutId}`);

    return { success: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not update workout.";
    return { error: message };
  }
}

export async function deleteWorkout(
  workoutId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." };
  }

  try {
    const deleted = await deleteWorkoutForUser(workoutId, user.id);
    if (!deleted) {
      return { error: "Workout not found." };
    }

    revalidatePath("/workouts");
    revalidatePath("/dashboard");
    revalidatePath(`/workouts/${workoutId}`);

    return { success: true };
  } catch {
    return { error: "Could not delete workout." };
  }
}
