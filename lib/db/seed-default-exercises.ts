import { sql } from "drizzle-orm";

import { DEFAULT_EXERCISES } from "@/lib/exercises/default-exercises";
import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";

/**
 * Inserts the built-in exercise library when the table is empty.
 * Idempotent — safe to run from app queries, CLI seed, and tests.
 */
export async function seedDefaultExercisesIfEmpty(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(exercises);
  const count = row?.count ?? 0;
  if (count > 0) return 0;

  await db.insert(exercises).values(
    DEFAULT_EXERCISES.map(
      ({ id, name, category, muscleGroup, equipment, isCustom, createdBy }) => ({
        id,
        name,
        category,
        muscleGroup,
        equipment,
        isCustom,
        createdBy,
      }),
    ),
  );

  return DEFAULT_EXERCISES.length;
}
