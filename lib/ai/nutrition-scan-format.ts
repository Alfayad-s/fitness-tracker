import { MEAL_TYPE_LABELS, type MealType } from "@/types/schemas/nutrition";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";

export function nutritionScanHasItems(extraction: NutritionScanExtraction): boolean {
  return extraction.meals.length > 0 || extraction.water.length > 0;
}

export function formatNutritionPreviewMessage(
  extraction: NutritionScanExtraction,
): string {
  const lines: string[] = [];

  if (extraction.summary?.trim()) {
    lines.push(extraction.summary.trim());
    lines.push("");
  }

  if (extraction.meals.length > 0) {
    lines.push("**Meals detected**");
    for (const meal of extraction.meals) {
      const type = MEAL_TYPE_LABELS[meal.mealType as MealType];
      const macros: string[] = [];
      if (meal.calories != null) macros.push(`${Math.round(meal.calories)} kcal`);
      if (meal.proteinG != null) macros.push(`${meal.proteinG}g protein`);
      if (meal.carbsG != null) macros.push(`${meal.carbsG}g carbs`);
      if (meal.fatG != null) macros.push(`${meal.fatG}g fat`);
      lines.push(`• **${meal.name}** (${type})${macros.length ? ` — ${macros.join(", ")}` : ""}`);
      if (meal.ingredients?.length) {
        lines.push(`  Ingredients: ${meal.ingredients.join(", ")}`);
      }
      if (meal.notes?.trim()) {
        lines.push(`  Note: ${meal.notes.trim()}`);
      }
    }
    lines.push("");
  }

  if (extraction.water.length > 0) {
    lines.push("**Hydration detected**");
    for (const w of extraction.water) {
      const label = w.label?.trim() ? ` (${w.label})` : "";
      lines.push(`• ${w.amountMl} ml${label}`);
    }
    lines.push("");
  }

  if (!nutritionScanHasItems(extraction)) {
    return (
      extraction.summary?.trim() ||
      "I couldn't find any meals or drinks to log. Try a clearer photo or describe what you ate or drank."
    );
  }

  lines.push(
    "Review the items above, then confirm to add them to today's meals & hydration log.",
  );

  return lines.join("\n").trim();
}

export function formatNutritionSavedMessage(
  extraction: NutritionScanExtraction,
  logDate: string,
): string {
  const mealCount = extraction.meals.length;
  const waterMl = extraction.water.reduce((s, w) => s + w.amountMl, 0);
  const parts: string[] = [];
  if (mealCount > 0) {
    parts.push(`${mealCount} meal${mealCount === 1 ? "" : "s"}`);
  }
  if (waterMl > 0) {
    parts.push(`${waterMl} ml water`);
  }
  return `Saved ${parts.join(" and ")} to your log for ${logDate}. View progress on Meals & hydration.`;
}
