import { z } from "zod";

export const MEAL_TYPES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "other",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  other: "Other",
};

const optionalPositiveNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  });

const logDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const mealEntrySchema = z.object({
  logDate: logDateSchema,
  mealType: z.enum(MEAL_TYPES).default("other"),
  name: z.string().trim().min(1, "Name is required").max(120),
  calories: optionalPositiveNumber,
  proteinG: optionalPositiveNumber,
  carbsG: optionalPositiveNumber,
  fatG: optionalPositiveNumber,
  notes: z.string().trim().max(500).optional(),
});

export type MealEntryFormValues = z.infer<typeof mealEntrySchema>;

export const waterEntrySchema = z.object({
  logDate: logDateSchema,
  amountMl: z.coerce.number().int().min(1).max(5000),
});

export type WaterEntryFormValues = z.infer<typeof waterEntrySchema>;

export const nutritionDayQuerySchema = z.object({
  logDate: logDateSchema,
});
