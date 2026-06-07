import { z } from "zod";

export const dailyPlanStatusSchema = z.enum([
  "suggested",
  "accepted",
  "skipped",
  "completed",
]);

export const dailyPlanExerciseSchema = z.object({
  exerciseName: z.string().min(1),
  exerciseId: z.string().uuid().optional().nullable(),
  muscleGroup: z.string().optional().nullable(),
  targetSets: z.number().int().min(1).max(20).optional().nullable(),
  targetReps: z.number().int().min(1).max(100).optional().nullable(),
  targetWeightKg: z.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const aiDailyPlanSchema = z.object({
  title: z.string().min(1),
  templateId: z.string().uuid().optional().nullable(),
  rationale: z.string().optional().nullable(),
  exercises: z.array(dailyPlanExerciseSchema).min(1),
});

export const workoutPlanPatchSchema = z.object({
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(120).optional(),
  status: dailyPlanStatusSchema.optional(),
  replaceExercises: z.array(dailyPlanExerciseSchema).optional(),
  addExercises: z.array(dailyPlanExerciseSchema).optional(),
  removeExerciseNames: z.array(z.string()).optional(),
});

export type DailyPlanExercise = z.infer<typeof dailyPlanExerciseSchema>;
export type AiDailyPlanExtraction = z.infer<typeof aiDailyPlanSchema>;
export type WorkoutPlanPatch = z.infer<typeof workoutPlanPatchSchema>;

export type DailyWorkoutPlanDetail = {
  id: string;
  planDate: string;
  templateId: string | null;
  title: string;
  status: z.infer<typeof dailyPlanStatusSchema>;
  aiRationale: string | null;
  exercises: DailyPlanExercise[];
};

export function normalizeAiDailyPlan(
  data: z.infer<typeof aiDailyPlanSchema>,
): AiDailyPlanExtraction {
  return {
    title: data.title.trim(),
    templateId: data.templateId ?? null,
    rationale: data.rationale?.trim() ?? null,
    exercises: data.exercises.map((ex) => ({
      exerciseName: ex.exerciseName.trim(),
      exerciseId: ex.exerciseId ?? null,
      muscleGroup: ex.muscleGroup?.trim() ?? null,
      targetSets: ex.targetSets ?? null,
      targetReps: ex.targetReps ?? null,
      targetWeightKg: ex.targetWeightKg ?? null,
      notes: ex.notes?.trim() ?? null,
    })),
  };
}

export function normalizeWorkoutPlanPatch(
  data: z.infer<typeof workoutPlanPatchSchema>,
): WorkoutPlanPatch {
  return {
    planDate: data.planDate,
    title: data.title?.trim(),
    status: data.status,
    replaceExercises: data.replaceExercises?.map((ex) => ({
      exerciseName: ex.exerciseName.trim(),
      exerciseId: ex.exerciseId ?? null,
      muscleGroup: ex.muscleGroup?.trim() ?? null,
      targetSets: ex.targetSets ?? null,
      targetReps: ex.targetReps ?? null,
      targetWeightKg: ex.targetWeightKg ?? null,
      notes: ex.notes?.trim() ?? null,
    })),
    addExercises: data.addExercises?.map((ex) => ({
      exerciseName: ex.exerciseName.trim(),
      exerciseId: ex.exerciseId ?? null,
      muscleGroup: ex.muscleGroup?.trim() ?? null,
      targetSets: ex.targetSets ?? null,
      targetReps: ex.targetReps ?? null,
      targetWeightKg: ex.targetWeightKg ?? null,
      notes: ex.notes?.trim() ?? null,
    })),
    removeExerciseNames: data.removeExerciseNames?.map((n) => n.trim()),
  };
}
