"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomExercise,
  deleteCustomExercise,
  listCustomExercisesForUser,
  updateCustomExercise,
} from "@/lib/db/queries/exercises";
import { createClient } from "@/lib/supabase/server";
import {
  createCustomExerciseSchema,
  type CreateCustomExerciseInput,
} from "@/types/schemas/exercise";
import type { Exercise } from "@/types";

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." };
  }

  return { userId: user.id };
}

export async function createCustomExerciseAction(
  input: CreateCustomExerciseInput,
): Promise<{ exercise: Exercise } | { error: string }> {
  const parsed = createCustomExerciseSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message =
      first.name?.[0] ??
      first.muscleGroup?.[0] ??
      first.equipment?.[0] ??
      "Invalid exercise data.";
    return { error: message };
  }

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  try {
    const exercise = await createCustomExercise(auth.userId, parsed.data);
    revalidatePath("/workouts");
    revalidatePath("/workouts/templates");
    return { exercise };
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE_EXERCISE_NAME") {
      return { error: "You already have a custom exercise with this name." };
    }
    return { error: "Could not create exercise. Please try again." };
  }
}

export async function fetchCustomExercises(muscleGroup?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, exercises: [] as const };

  const exercises = await listCustomExercisesForUser(auth.userId);
  const filtered =
    muscleGroup && muscleGroup !== "all"
      ? exercises.filter((ex) => ex.muscleGroup === muscleGroup)
      : exercises;

  return { exercises: filtered };
}

export async function updateCustomExerciseAction(
  exerciseId: string,
  input: CreateCustomExerciseInput,
) {
  const parsed = createCustomExerciseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid exercise data." };
  }

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  try {
    const exercise = await updateCustomExercise(
      exerciseId,
      auth.userId,
      parsed.data,
    );
    if (!exercise) return { error: "Exercise not found." };

    revalidatePath("/workouts");
    revalidatePath("/workouts/templates");
    return { exercise };
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE_EXERCISE_NAME") {
      return { error: "You already have a custom exercise with this name." };
    }
    return { error: "Could not update exercise." };
  }
}

export async function deleteCustomExerciseAction(exerciseId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const ok = await deleteCustomExercise(exerciseId, auth.userId);
  if (!ok) return { error: "Exercise not found." };

  revalidatePath("/workouts");
  revalidatePath("/workouts/templates");
  return { success: true as const };
}
