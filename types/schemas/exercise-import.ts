import { z } from "zod";

export const exerciseImportItemSchema = z.object({
  name: z.string().min(1),
  muscleGroup: z.string().optional().nullable(),
  equipment: z.string().optional().nullable(),
  targetSets: z.number().int().min(1).max(20).optional().nullable(),
  targetReps: z.number().int().min(1).max(100).optional().nullable(),
  targetWeightKg: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const exerciseImportSchema = z.object({
  exercises: z.array(exerciseImportItemSchema).min(1),
  applyTo: z.enum(["catalog", "today_plan", "template"]).optional(),
  templateId: z.string().uuid().optional().nullable(),
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type ExerciseImportItem = z.infer<typeof exerciseImportItemSchema>;
export type ExerciseImportExtraction = z.infer<typeof exerciseImportSchema>;

export function normalizeExerciseImport(
  data: z.infer<typeof exerciseImportSchema>,
): ExerciseImportExtraction {
  return {
    exercises: data.exercises.map((ex) => ({
      name: ex.name.trim(),
      muscleGroup: ex.muscleGroup?.trim().toLowerCase() ?? null,
      equipment: ex.equipment?.trim() ?? null,
      targetSets: ex.targetSets ?? null,
      targetReps: ex.targetReps ?? null,
      targetWeightKg: ex.targetWeightKg ?? null,
      notes: ex.notes?.trim() ?? null,
    })),
    applyTo: data.applyTo ?? "catalog",
    templateId: data.templateId ?? null,
    planDate: data.planDate ?? null,
  };
}
