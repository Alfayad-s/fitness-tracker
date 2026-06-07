import { z } from "zod";

export const templateExerciseInputSchema = z.object({
  exerciseId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).max(20).optional().nullable(),
  targetReps: z.number().int().min(1).max(100).optional().nullable(),
  targetWeightKg: z.number().min(0).max(999).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createWorkoutTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  source: z.enum(["manual", "ai", "imported"]).optional(),
  exercises: z.array(templateExerciseInputSchema).min(1),
});

export const updateWorkoutTemplateSchema = createWorkoutTemplateSchema.partial({
  exercises: true,
});

export type TemplateExerciseInput = z.infer<typeof templateExerciseInputSchema>;
export type CreateWorkoutTemplateInput = z.infer<
  typeof createWorkoutTemplateSchema
>;
export type UpdateWorkoutTemplateInput = z.infer<
  typeof updateWorkoutTemplateSchema
>;

export type WorkoutTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  source: "manual" | "ai" | "imported";
  isFavorite: boolean;
  exerciseCount: number;
  updatedAt: Date;
};

export type TemplateExerciseDetail = {
  id: string;
  exerciseId: string;
  orderIndex: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    category: string;
    muscleGroup: string;
    equipment: string | null;
  };
};

export type WorkoutTemplateDetail = WorkoutTemplateSummary & {
  exercises: TemplateExerciseDetail[];
};
