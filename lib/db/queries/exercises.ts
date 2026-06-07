import { and, eq, ilike, or, sql } from "drizzle-orm";

import type { CreateCustomExerciseInput } from "@/types/schemas/exercise";

import { seedDefaultExercisesIfEmpty as seedDefaults } from "@/lib/db/seed-default-exercises";
import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db/with-db";
import { exercises } from "@/lib/db/schema";
import type { Exercise } from "@/types";

export async function countExercises(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(exercises);
  return row?.count ?? 0;
}

export async function seedDefaultExercisesIfEmpty(): Promise<void> {
  await seedDefaults();
}

export async function listExercisesForUser(userId: string): Promise<Exercise[]> {
  return withDbFallback(
    "listExercisesForUser",
    async () => {
      await seedDefaultExercisesIfEmpty();
      return db
        .select()
        .from(exercises)
        .where(
          or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId)),
        )
        .orderBy(exercises.name);
    },
    [],
  );
}

export async function searchExercises(
  userId: string,
  query: string,
  muscleGroup?: string,
): Promise<Exercise[]> {
  return withDbFallback(
    "searchExercises",
    async () => {
      await seedDefaultExercisesIfEmpty();

      const trimmed = query.trim();
      const filters = [
        or(eq(exercises.isCustom, false), eq(exercises.createdBy, userId)),
      ];

      if (trimmed.length > 0) {
        filters.push(ilike(exercises.name, `%${trimmed}%`));
      }

      if (muscleGroup && muscleGroup !== "all") {
        filters.push(eq(exercises.muscleGroup, muscleGroup));
      }

      return db
        .select()
        .from(exercises)
        .where(and(...filters))
        .orderBy(exercises.name)
        .limit(50);
    },
    [],
  );
}

export async function findCustomExerciseByName(
  userId: string,
  name: string,
): Promise<Exercise | null> {
  const normalized = name.trim();
  const [row] = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.isCustom, true),
        eq(exercises.createdBy, userId),
        sql`lower(${exercises.name}) = lower(${normalized})`,
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function createCustomExercise(
  userId: string,
  input: CreateCustomExerciseInput,
): Promise<Exercise> {
  await seedDefaultExercisesIfEmpty();

  const duplicate = await findCustomExerciseByName(userId, input.name);
  if (duplicate) {
    throw new Error("DUPLICATE_EXERCISE_NAME");
  }

  const [created] = await db
    .insert(exercises)
    .values({
      name: input.name.trim(),
      category: "strength",
      muscleGroup: input.muscleGroup,
      equipment: input.equipment ?? null,
      isCustom: true,
      createdBy: userId,
    })
    .returning();

  return created;
}

export async function listCustomExercisesForUser(
  userId: string,
): Promise<Exercise[]> {
  return withDbFallback(
    "listCustomExercisesForUser",
    async () =>
      db
        .select()
        .from(exercises)
        .where(
          and(eq(exercises.isCustom, true), eq(exercises.createdBy, userId)),
        )
        .orderBy(exercises.name),
    [],
  );
}

export async function getCustomExerciseForUser(
  exerciseId: string,
  userId: string,
): Promise<Exercise | null> {
  const [row] = await db
    .select()
    .from(exercises)
    .where(
      and(
        eq(exercises.id, exerciseId),
        eq(exercises.isCustom, true),
        eq(exercises.createdBy, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function updateCustomExercise(
  exerciseId: string,
  userId: string,
  input: CreateCustomExerciseInput,
): Promise<Exercise | null> {
  const existing = await getCustomExerciseForUser(exerciseId, userId);
  if (!existing) return null;

  const duplicate = await findCustomExerciseByName(userId, input.name);
  if (duplicate && duplicate.id !== exerciseId) {
    throw new Error("DUPLICATE_EXERCISE_NAME");
  }

  const [updated] = await db
    .update(exercises)
    .set({
      name: input.name.trim(),
      muscleGroup: input.muscleGroup,
      equipment: input.equipment ?? null,
    })
    .where(eq(exercises.id, exerciseId))
    .returning();

  return updated ?? null;
}

export async function deleteCustomExercise(
  exerciseId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(exercises)
    .where(
      and(
        eq(exercises.id, exerciseId),
        eq(exercises.isCustom, true),
        eq(exercises.createdBy, userId),
      ),
    )
    .returning({ id: exercises.id });

  return result.length > 0;
}
