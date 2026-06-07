import {
  createWorkoutTemplate,
  listWorkoutTemplatesForUser,
} from "@/lib/db/queries/workout-templates";
import { resolveDailyPlanExercises } from "@/lib/workout/resolve-exercise-names";
import {
  getPresetTemplateDefinition,
  type PresetTemplateDefinition,
} from "@/lib/workout/preset-templates";

export async function ensurePresetTemplatesForUser(
  userId: string,
  templateNames: string[],
): Promise<Map<string, string>> {
  const existing = await listWorkoutTemplatesForUser(userId);
  const templateIdsByName = new Map(
    existing.map((template) => [template.name.toLowerCase(), template.id]),
  );

  for (const templateName of templateNames) {
    const key = templateName.toLowerCase();
    if (templateIdsByName.has(key)) continue;

    const definition = getPresetTemplateDefinition(templateName);
    if (!definition) continue;

    const templateId = await createPresetTemplateForUser(userId, definition);
    templateIdsByName.set(key, templateId);
  }

  return templateIdsByName;
}

async function createPresetTemplateForUser(
  userId: string,
  definition: PresetTemplateDefinition,
): Promise<string> {
  const resolved = await resolveDailyPlanExercises(
    userId,
    definition.exercises,
    true,
  );

  const template = await createWorkoutTemplate(userId, {
    name: definition.name,
    description: definition.description,
    source: "imported",
    exercises: resolved.map((exercise, index) => ({
      exerciseId: exercise.exerciseId!,
      orderIndex: index,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      notes: exercise.notes,
    })),
  });

  return template.id;
}
