import { ilike, or, eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { seedDefaultExercisesIfEmpty } from "@/lib/db/seed-default-exercises";
import {
  createCustomExercise,
  findCustomExerciseByName,
} from "@/lib/db/queries/exercises";
import type { CreateCustomExerciseInput } from "@/types/schemas/exercise";
import type { DailyPlanExercise } from "@/types/schemas/daily-plan";
import type { ExerciseImportItem } from "@/types/schemas/exercise-import";
import type { Exercise } from "@/types";

const MUSCLE_GROUPS = new Set([
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "full_body",
  "cardio",
]);

const CUSTOM_MUSCLE_GROUPS = new Set([
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
]);

function normalizeMuscleGroup(
  value: string | null | undefined,
): CreateCustomExerciseInput["muscleGroup"] {
  const normalized = (value ?? "core").trim().toLowerCase();
  if (CUSTOM_MUSCLE_GROUPS.has(normalized)) {
    return normalized as CreateCustomExerciseInput["muscleGroup"];
  }
  if (normalized === "full_body" || normalized === "cardio") {
    return "core";
  }
  return "core";
}

export async function findExerciseByNameForUser(
  userId: string,
  name: string,
): Promise<Exercise | null> {
  await seedDefaultExercisesIfEmpty();
  const trimmed = name.trim();

  const custom = await findCustomExerciseByName(userId, trimmed);
  if (custom) return custom;

  const [match] = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.isCustom, false),
        ilike(exercises.name, trimmed),
      ),
    )
    .limit(1);

  return match ?? null;
}

export async function resolveExerciseByNameForUser(
  userId: string,
  name: string,
  muscleGroup?: string | null,
  createIfMissing = false,
): Promise<Exercise | null> {
  const existing = await findExerciseByNameForUser(userId, name);
  if (existing) return existing;

  if (!createIfMissing) return null;

  return createCustomExercise(userId, {
    name: name.trim(),
    muscleGroup: normalizeMuscleGroup(muscleGroup),
    equipment: undefined,
  });
}

export async function resolveDailyPlanExercises(
  userId: string,
  items: DailyPlanExercise[],
  createIfMissing = true,
): Promise<DailyPlanExercise[]> {
  const resolved: DailyPlanExercise[] = [];

  for (const item of items) {
    if (item.exerciseId) {
      resolved.push(item);
      continue;
    }

    const exercise = await resolveExerciseByNameForUser(
      userId,
      item.exerciseName,
      item.muscleGroup,
      createIfMissing,
    );

    if (!exercise) continue;

    resolved.push({
      ...item,
      exerciseId: exercise.id,
      muscleGroup: exercise.muscleGroup,
    });
  }

  return resolved;
}

export async function resolveExerciseImportItems(
  userId: string,
  items: ExerciseImportItem[],
  createIfMissing = true,
): Promise<Array<ExerciseImportItem & { exerciseId: string }>> {
  const resolved: Array<ExerciseImportItem & { exerciseId: string }> = [];

  for (const item of items) {
    const exercise = await resolveExerciseByNameForUser(
      userId,
      item.name,
      item.muscleGroup,
      createIfMissing,
    );
    if (!exercise) continue;
    resolved.push({ ...item, exerciseId: exercise.id });
  }

  return resolved;
}

export async function fuzzySearchExerciseNamesForUser(
  userId: string,
  query: string,
  limit = 10,
): Promise<string[]> {
  await seedDefaultExercisesIfEmpty();
  const rows = await db
    .select({ name: exercises.name })
    .from(exercises)
    .where(
      and(
        or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId)),
        ilike(exercises.name, `%${query.trim()}%`),
      ),
    )
    .limit(limit);

  return rows.map((row) => row.name);
}
