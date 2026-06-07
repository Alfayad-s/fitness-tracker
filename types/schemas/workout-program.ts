import { z } from "zod";

export const programDayInputSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  templateId: z.string().uuid().optional().nullable(),
  isRestDay: z.boolean().optional(),
  label: z.string().max(80).optional().nullable(),
});

export const createWorkoutProgramSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  source: z.enum(["manual", "ai", "preset"]).optional(),
  days: z.array(programDayInputSchema).min(1).max(7),
  activate: z.boolean().optional(),
});

export type ProgramDayInput = z.infer<typeof programDayInputSchema>;
export type CreateWorkoutProgramInput = z.infer<
  typeof createWorkoutProgramSchema
>;

export type WorkoutProgramSummary = {
  id: string;
  name: string;
  description: string | null;
  source: "manual" | "ai" | "preset";
  isActive: boolean;
  dayCount: number;
};

export type ProgramDayDetail = {
  id: string;
  dayOfWeek: number;
  templateId: string | null;
  isRestDay: boolean;
  label: string | null;
  templateName: string | null;
};

export type WorkoutProgramDetail = WorkoutProgramSummary & {
  days: ProgramDayDetail[];
};
