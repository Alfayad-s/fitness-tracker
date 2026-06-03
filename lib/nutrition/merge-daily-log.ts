import type { DailyNutritionLog } from "@/lib/db/queries/nutrition";
import type { MealEntry, WaterEntry } from "@/types";

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

export function computeDailyTotals(
  meals: MealEntry[],
  waterEntries: WaterEntry[],
): DailyNutritionLog["totals"] {
  return {
    calories: Math.round(sumMealField(meals, "calories")),
    proteinG: Math.round(sumMealField(meals, "proteinG") * 10) / 10,
    carbsG: Math.round(sumMealField(meals, "carbsG") * 10) / 10,
    fatG: Math.round(sumMealField(meals, "fatG") * 10) / 10,
    waterMl: waterEntries.reduce((sum, w) => sum + w.amountMl, 0),
  };
}

export function withDailyTotals(
  logDate: string,
  meals: MealEntry[],
  waterEntries: WaterEntry[],
): DailyNutritionLog {
  return {
    logDate,
    meals,
    waterEntries,
    totals: computeDailyTotals(meals, waterEntries),
  };
}

export function addWaterToLog(
  log: DailyNutritionLog,
  entry: WaterEntry,
): DailyNutritionLog {
  return withDailyTotals(log.logDate, log.meals, [entry, ...log.waterEntries]);
}

export function removeWaterFromLog(
  log: DailyNutritionLog,
  id: string,
): DailyNutritionLog {
  return withDailyTotals(
    log.logDate,
    log.meals,
    log.waterEntries.filter((e) => e.id !== id),
  );
}

export function replaceWaterInLog(
  log: DailyNutritionLog,
  tempId: string,
  entry: WaterEntry,
): DailyNutritionLog {
  return withDailyTotals(
    log.logDate,
    log.meals,
    log.waterEntries.map((e) => (e.id === tempId ? entry : e)),
  );
}

export function addMealToLog(
  log: DailyNutritionLog,
  meal: MealEntry,
): DailyNutritionLog {
  return withDailyTotals(log.logDate, [meal, ...log.meals], log.waterEntries);
}

export function removeMealFromLog(
  log: DailyNutritionLog,
  id: string,
): DailyNutritionLog {
  return withDailyTotals(
    log.logDate,
    log.meals.filter((m) => m.id !== id),
    log.waterEntries,
  );
}

export function replaceMealInLog(
  log: DailyNutritionLog,
  tempId: string,
  meal: MealEntry,
): DailyNutritionLog {
  return withDailyTotals(
    log.logDate,
    log.meals.map((m) => (m.id === tempId ? meal : m)),
    log.waterEntries,
  );
}

export function createOptimisticWaterEntry(
  logDate: string,
  amountMl: number,
  tempId: string,
): WaterEntry {
  const now = new Date();
  return {
    id: tempId,
    userId: "",
    logDate,
    amountMl,
    loggedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
