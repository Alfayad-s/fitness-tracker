"use server";

import { revalidatePath } from "next/cache";

import { createCustomExercise } from "@/lib/db/queries/exercises";
import { createClient } from "@/lib/supabase/server";
import {
  createCustomExerciseSchema,
  type CreateCustomExerciseInput,
} from "@/types/schemas/exercise";
import type { Exercise } from "@/types";

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

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "You must be signed in." };
  }

  try {
    const exercise = await createCustomExercise(user.id, parsed.data);
    revalidatePath("/workouts");
    return { exercise };
  } catch (err) {
    if (err instanceof Error && err.message === "DUPLICATE_EXERCISE_NAME") {
      return { error: "You already have a custom exercise with this name." };
    }
    return { error: "Could not create exercise. Please try again." };
  }
}
