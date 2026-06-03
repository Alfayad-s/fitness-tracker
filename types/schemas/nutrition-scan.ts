import { z } from "zod";

import { todayDateString } from "@/lib/workout/format";
import { MEAL_TYPES } from "@/types/schemas/nutrition";

export const scannedMealSchema = z.object({
  mealType: z.enum(MEAL_TYPES).default("other"),
  name: z.string().trim().min(1),
  calories: z.number().finite().nonnegative().optional().nullable(),
  proteinG: z.number().finite().nonnegative().optional().nullable(),
  carbsG: z.number().finite().nonnegative().optional().nullable(),
  fatG: z.number().finite().nonnegative().optional().nullable(),
  ingredients: z.array(z.string().trim().min(1)).optional().default([]),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const scannedWaterSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  label: z.string().trim().max(120).optional().nullable(),
});

export const nutritionScanSchema = z.object({
  logDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  meals: z.array(scannedMealSchema).default([]),
  water: z.array(scannedWaterSchema).default([]),
  summary: z.string().trim().max(2000).optional().nullable(),
});

export type ScannedMeal = z.infer<typeof scannedMealSchema>;
export type ScannedWater = z.infer<typeof scannedWaterSchema>;
export type NutritionScanExtraction = z.infer<typeof nutritionScanSchema>;

export function normalizeNutritionScan(
  raw: NutritionScanExtraction,
): NutritionScanExtraction {
  const parsed = nutritionScanSchema.parse({
    ...raw,
    meals: raw.meals ?? [],
    water: raw.water ?? [],
  });
  return {
    ...parsed,
    logDate: parsed.logDate ?? todayDateString(),
  };
}
