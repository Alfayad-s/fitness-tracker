"use server";

import { revalidatePath } from "next/cache";

import {
  createWorkoutTemplate,
  deleteWorkoutTemplateForUser,
  duplicateWorkoutTemplateForUser,
  getWorkoutTemplateForUser,
  listWorkoutTemplatesForUser,
  setWorkoutTemplateFavorite,
  updateWorkoutTemplate,
} from "@/lib/db/queries/workout-templates";
import { getWorkoutDetail } from "@/lib/db/queries/workouts";
import { getRequestUser } from "@/lib/auth/require-user";
import { workoutDetailToTemplateInput } from "@/lib/workout/workout-detail-to-template";
import {
  createWorkoutTemplateSchema,
  updateWorkoutTemplateSchema,
  type CreateWorkoutTemplateInput,
  type UpdateWorkoutTemplateInput,
} from "@/types/schemas/workout-template";

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const user = await getRequestUser();
  if (!user) return { error: "You must be signed in." };
  return { userId: user.id };
}

export async function fetchWorkoutTemplates() {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, templates: [] as const };
  const templates = await listWorkoutTemplatesForUser(auth.userId);
  return { templates };
}

export async function fetchWorkoutTemplate(templateId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, template: null };
  const template = await getWorkoutTemplateForUser(templateId, auth.userId);
  if (!template) return { error: "Template not found.", template: null };
  return { template };
}

export async function createWorkoutTemplateAction(
  input: CreateWorkoutTemplateInput,
) {
  const parsed = createWorkoutTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid template data." };
  }

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  try {
    const template = await createWorkoutTemplate(auth.userId, parsed.data);
    revalidatePath("/workouts");
    revalidatePath("/workouts/templates");
    revalidatePath("/dashboard");
    return { template };
  } catch {
    return { error: "Could not create template." };
  }
}

export async function updateWorkoutTemplateAction(
  templateId: string,
  input: UpdateWorkoutTemplateInput,
) {
  const parsed = updateWorkoutTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid template data." };
  }

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const template = await updateWorkoutTemplate(
    templateId,
    auth.userId,
    parsed.data,
  );
  if (!template) return { error: "Template not found." };

  revalidatePath("/workouts");
  revalidatePath("/workouts/templates");
  revalidatePath(`/workouts/templates/${templateId}/edit`);
  return { template };
}

export async function deleteWorkoutTemplateAction(templateId: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const ok = await deleteWorkoutTemplateForUser(templateId, auth.userId);
  if (!ok) return { error: "Template not found." };

  revalidatePath("/workouts");
  revalidatePath("/workouts/templates");
  return { success: true as const };
}

export async function duplicateWorkoutTemplateAction(
  templateId: string,
  name?: string,
) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const template = await duplicateWorkoutTemplateForUser(
    templateId,
    auth.userId,
    name,
  );
  if (!template) return { error: "Template not found." };

  revalidatePath("/workouts/templates");
  return { template };
}

export async function toggleWorkoutTemplateFavoriteAction(
  templateId: string,
  isFavorite: boolean,
) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const ok = await setWorkoutTemplateFavorite(
    templateId,
    auth.userId,
    isFavorite,
  );
  if (!ok) return { error: "Template not found." };

  revalidatePath("/workouts/templates");
  return { success: true as const };
}

export async function saveWorkoutAsTemplateAction(
  workoutId: string,
  name?: string,
) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const workout = await getWorkoutDetail(workoutId, auth.userId);
  if (!workout) return { error: "Workout not found." };
  if (workout.workoutExercises.length === 0) {
    return { error: "Workout has no exercises to save." };
  }

  try {
    const template = await createWorkoutTemplate(
      auth.userId,
      workoutDetailToTemplateInput(workout, name),
    );
    revalidatePath("/workouts/templates");
    return { template };
  } catch {
    return { error: "Could not save template." };
  }
}
