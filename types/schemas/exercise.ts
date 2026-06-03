import { z } from "zod";

const muscleGroups = [
  "chest",
  "back",
  "shoulders",
  "legs",
  "arms",
  "core",
] as const;

export const createCustomExerciseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  muscleGroup: z.enum(muscleGroups, {
    error: "Pick a muscle group",
  }),
  equipment: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateCustomExerciseInput = z.infer<typeof createCustomExerciseSchema>;
