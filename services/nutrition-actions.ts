"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/require-user";
import { DbError, isPostgresMissingRelation, DB_MIGRATION_HINT } from "@/lib/db/errors";
import { db } from "@/lib/db";
import { getDailyNutritionLog } from "@/lib/db/queries/nutrition";
import { mealEntries, waterEntries } from "@/lib/db/schema";
import {
  mealEntrySchema,
  waterEntrySchema,
  type MealEntryFormValues,
  type WaterEntryFormValues,
} from "@/types/schemas/nutrition";
import { and, eq } from "drizzle-orm";
import type { MealEntry, WaterEntry } from "@/types";

function mapDbError(error: unknown, fallback: string): string {
  if (error instanceof DbError) return error.userMessage;
  if (isPostgresMissingRelation(error)) return DB_MIGRATION_HINT;
  return fallback;
}

/** Soft-invalidates nutrition page; client updates optimistically so this is not on the hot path. */
function revalidateNutritionPage() {
  revalidatePath("/nutrition", "page");
}

export async function fetchDailyNutritionLog(logDate: string) {
  const auth = await requireUser();
  if ("error" in auth) {
    return { error: auth.error, log: null };
  }

  const log = await getDailyNutritionLog(auth.user.id, logDate);
  return { log };
}

export async function createMealEntry(
  input: MealEntryFormValues,
): Promise<{ success: true; meal: MealEntry } | { error: string }> {
  const parsed = mealEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid meal data." };
  }

  const auth = await requireUser();
  if ("error" in auth) return auth;

  const v = parsed.data;

  try {
    const [row] = await db
      .insert(mealEntries)
      .values({
        userId: auth.user.id,
        logDate: v.logDate,
        mealType: v.mealType,
        name: v.name,
        calories: v.calories != null ? Math.round(v.calories) : null,
        proteinG: v.proteinG != null ? String(v.proteinG) : null,
        carbsG: v.carbsG != null ? String(v.carbsG) : null,
        fatG: v.fatG != null ? String(v.fatG) : null,
        notes: v.notes || null,
      })
      .returning();

    revalidateNutritionPage();
    return { success: true, meal: row };
  } catch (e) {
    return { error: mapDbError(e, "Could not save meal.") };
  }
}

export async function deleteMealEntry(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  try {
    await db
      .delete(mealEntries)
      .where(
        and(eq(mealEntries.id, id), eq(mealEntries.userId, auth.user.id)),
      );

    revalidateNutritionPage();
    return { success: true };
  } catch (e) {
    return { error: mapDbError(e, "Could not delete meal.") };
  }
}

export async function addWaterEntry(
  input: WaterEntryFormValues,
): Promise<{ success: true; entry: WaterEntry } | { error: string }> {
  const parsed = waterEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid amount." };
  }

  const auth = await requireUser();
  if ("error" in auth) return auth;

  try {
    const [row] = await db
      .insert(waterEntries)
      .values({
        userId: auth.user.id,
        logDate: parsed.data.logDate,
        amountMl: parsed.data.amountMl,
      })
      .returning();

    revalidateNutritionPage();
    return { success: true, entry: row };
  } catch (e) {
    return { error: mapDbError(e, "Could not log water.") };
  }
}

export async function deleteWaterEntry(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const auth = await requireUser();
  if ("error" in auth) return auth;

  try {
    await db
      .delete(waterEntries)
      .where(
        and(eq(waterEntries.id, id), eq(waterEntries.userId, auth.user.id)),
      );

    revalidateNutritionPage();
    return { success: true };
  } catch (e) {
    return { error: mapDbError(e, "Could not remove water log.") };
  }
}
