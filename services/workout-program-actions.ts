"use server";

import { revalidatePath } from "next/cache";

import { getRequestUser } from "@/lib/auth/require-user";
import {
  activateWorkoutProgram,
  createWorkoutProgram,
  deleteWorkoutProgramForUser,
  getActiveWorkoutProgramForUser,
  getWorkoutProgramForUser,
  listWorkoutProgramsForUser,
} from "@/lib/db/queries/workout-programs";
import { ensurePresetTemplatesForUser } from "@/lib/workout/ensure-preset-templates";
import { PRESET_PROGRAMS } from "@/lib/workout/preset-programs";
import {
  collectPresetTemplateNames,
  PRESET_WORKOUT_TEMPLATES,
} from "@/lib/workout/preset-templates";
import {
  createWorkoutProgramSchema,
  type CreateWorkoutProgramInput,
} from "@/types/schemas/workout-program";

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const user = await getRequestUser();
  if (!user) return { error: "You must be signed in." };
  return { userId: user.id };
}

export async function fetchWorkoutPrograms() {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, programs: [] as const };
  const programs = await listWorkoutProgramsForUser(auth.userId);
  return { programs };
}

export async function fetchActiveWorkoutProgram() {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, program: null };
  const program = await getActiveWorkoutProgramForUser(auth.userId);
  return { program };
}

export async function fetchWorkoutProgram(programId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, program: null };
  const program = await getWorkoutProgramForUser(programId, auth.userId);
  if (!program) return { error: "Program not found.", program: null };
  return { program };
}

export async function createWorkoutProgramAction(
  input: CreateWorkoutProgramInput,
) {
  const parsed = createWorkoutProgramSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid program data." };

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  try {
    const program = await createWorkoutProgram(auth.userId, parsed.data);
    revalidatePath("/workouts/programs");
    revalidatePath("/dashboard");
    revalidatePath("/workouts/new");
    return { program };
  } catch {
    return { error: "Could not create program." };
  }
}

export async function activateWorkoutProgramAction(programId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const program = await activateWorkoutProgram(programId, auth.userId);
  if (!program) return { error: "Program not found." };

  revalidatePath("/workouts/programs");
  revalidatePath("/dashboard");
  revalidatePath("/workouts/new");
  return { program };
}

export async function deleteWorkoutProgramAction(programId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const ok = await deleteWorkoutProgramForUser(programId, auth.userId);
  if (!ok) return { error: "Program not found." };

  revalidatePath("/workouts/programs");
  return { success: true as const };
}

export async function activatePresetProgramAction(presetId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const preset = PRESET_PROGRAMS.find((p) => p.id === presetId);
  if (!preset) return { error: "Preset not found." };

  const templateNames =
    presetId === "ppl-growth"
      ? PRESET_WORKOUT_TEMPLATES.map((template) => template.name)
      : collectPresetTemplateNames(preset.days.map((day) => day.templateName));

  const templateByName = await ensurePresetTemplatesForUser(
    auth.userId,
    templateNames,
  );

  const days = preset.days.map((day) => {
    const templateId =
      day.isRestDay || !day.templateName
        ? null
        : (templateByName.get(day.templateName.toLowerCase()) ?? null);

    return {
      dayOfWeek: day.dayOfWeek,
      label: day.label,
      isRestDay: day.isRestDay,
      templateId,
    };
  });

  try {
    const program = await createWorkoutProgram(auth.userId, {
      name: preset.name,
      description: preset.description,
      source: "preset",
      activate: true,
      days,
    });

    revalidatePath("/workouts/programs");
    revalidatePath("/workouts/templates");
    revalidatePath("/dashboard");
    revalidatePath("/workouts/new");
    return { program };
  } catch {
    return { error: "Could not activate preset program." };
  }
}

export async function fetchPresetPrograms() {
  return { presets: PRESET_PROGRAMS };
}

export async function installGrowthPresetTemplatesAction() {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  await ensurePresetTemplatesForUser(
    auth.userId,
    PRESET_WORKOUT_TEMPLATES.map((template) => template.name),
  );

  revalidatePath("/workouts/templates");
  revalidatePath("/workouts");
  return { success: true as const };
}
