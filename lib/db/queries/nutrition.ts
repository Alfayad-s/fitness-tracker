import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { withDbFallback } from "@/lib/db/with-db";
import { mealEntries, waterEntries } from "@/lib/db/schema";
import type { MealEntry, WaterEntry } from "@/types";

export type DailyNutritionLog = {
  logDate: string;
  meals: MealEntry[];
  waterEntries: WaterEntry[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    waterMl: number;
  };
};

function sumMealField(
  meals: MealEntry[],
  field: "calories" | "proteinG" | "carbsG" | "fatG",
): number {
  return meals.reduce((sum, m) => {
    const raw = m[field];
    if (raw == null || raw === "") return sum;
    const n = Number(raw);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export async function listMealsForDay(
  userId: string,
  logDate: string,
): Promise<MealEntry[]> {
  return withDbFallback(
    "listMealsForDay",
    async () =>
      db
        .select()
        .from(mealEntries)
        .where(
          and(eq(mealEntries.userId, userId), eq(mealEntries.logDate, logDate)),
        )
        .orderBy(desc(mealEntries.loggedAt)),
    [],
  );
}

export async function listWaterForDay(
  userId: string,
  logDate: string,
): Promise<WaterEntry[]> {
  return withDbFallback(
    "listWaterForDay",
    async () =>
      db
        .select()
        .from(waterEntries)
        .where(
          and(
            eq(waterEntries.userId, userId),
            eq(waterEntries.logDate, logDate),
          ),
        )
        .orderBy(desc(waterEntries.loggedAt)),
    [],
  );
}

export async function getDailyNutritionLog(
  userId: string,
  logDate: string,
): Promise<DailyNutritionLog> {
  const [meals, water] = await Promise.all([
    listMealsForDay(userId, logDate),
    listWaterForDay(userId, logDate),
  ]);

  const waterMl = water.reduce((sum, w) => sum + w.amountMl, 0);

  return {
    logDate,
    meals,
    waterEntries: water,
    totals: {
      calories: Math.round(sumMealField(meals, "calories")),
      proteinG: Math.round(sumMealField(meals, "proteinG") * 10) / 10,
      carbsG: Math.round(sumMealField(meals, "carbsG") * 10) / 10,
      fatG: Math.round(sumMealField(meals, "fatG") * 10) / 10,
      waterMl,
    },
  };
}

export async function listWaterBetween(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<WaterEntry[]> {
  return withDbFallback(
    "listWaterBetween",
    async () =>
      db
        .select()
        .from(waterEntries)
        .where(
          and(
            eq(waterEntries.userId, userId),
            gte(waterEntries.logDate, fromDate),
            lte(waterEntries.logDate, toDate),
          ),
        )
        .orderBy(desc(waterEntries.logDate), desc(waterEntries.loggedAt)),
    [],
  );
}
