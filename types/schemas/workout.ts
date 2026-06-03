import { z } from "zod";

export const sessionSetSchema = z.object({
  id: z.string().uuid(),
  reps: z.number().int().min(0).nullable(),
  weightKg: z.number().min(0).nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  restSeconds: z.number().int().min(0).nullable(),
  isWarmup: z.boolean(),
  completedAt: z.string().nullable(),
});

export const sessionExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string().min(1),
  category: z.string(),
  muscleGroup: z.string(),
  equipment: z.string().nullable(),
  orderIndex: z.number().int().min(0),
  sets: z.array(sessionSetSchema).min(1),
});

export const saveWorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(2000).nullable(),
  feeling: z.enum(["terrible", "bad", "okay", "good", "great"]).nullable(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
  totalPausedMs: z.number().int().min(0),
  exercises: z.array(sessionExerciseSchema),
});

export type SaveWorkoutSessionInput = z.infer<typeof saveWorkoutSessionSchema>;

export const startWorkoutFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  notes: z.string().max(2000).optional(),
});

export type StartWorkoutFormValues = z.infer<typeof startWorkoutFormSchema>;

export const updateWorkoutPayloadSchema = saveWorkoutSessionSchema.extend({
  workoutId: z.string().uuid(),
});

export type UpdateWorkoutPayload = z.infer<typeof updateWorkoutPayloadSchema>;
