import { db } from "@/lib/db";
import { getDailyNutritionLog } from "@/lib/db/queries/nutrition";
import { mealEntries, waterEntries } from "@/lib/db/schema";
import type { DailyNutritionLog } from "@/lib/db/queries/nutrition";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";
import { todayDateString } from "@/lib/workout/format";

export async function applyNutritionScanToUser(
  userId: string,
  extraction: NutritionScanExtraction,
): Promise<{ logDate: string; log: DailyNutritionLog }> {
  const logDate = extraction.logDate ?? todayDateString();

  if (extraction.meals.length > 0) {
    await db.insert(mealEntries).values(
      extraction.meals.map((meal) => ({
        userId,
        logDate,
        mealType: meal.mealType,
        name: meal.name,
        calories:
          meal.calories != null ? Math.round(meal.calories) : null,
        proteinG: meal.proteinG != null ? String(meal.proteinG) : null,
        carbsG: meal.carbsG != null ? String(meal.carbsG) : null,
        fatG: meal.fatG != null ? String(meal.fatG) : null,
        notes: buildMealNotes(meal.ingredients, meal.notes),
      })),
    );
  }

  if (extraction.water.length > 0) {
    await db.insert(waterEntries).values(
      extraction.water.map((w) => ({
        userId,
        logDate,
        amountMl: w.amountMl,
      })),
    );
  }

  const log = await getDailyNutritionLog(userId, logDate);
  return { logDate, log };
}

function buildMealNotes(
  ingredients: string[] | undefined,
  notes: string | null | undefined,
): string | null {
  const parts: string[] = [];
  if (ingredients?.length) {
    parts.push(`Ingredients: ${ingredients.join(", ")}`);
  }
  if (notes?.trim()) {
    parts.push(notes.trim());
  }
  return parts.length > 0 ? parts.join("\n") : null;
}
