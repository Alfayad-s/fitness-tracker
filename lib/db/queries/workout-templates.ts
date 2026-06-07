import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  exercises,
  templateExercises,
  workoutTemplates,
} from "@/lib/db/schema";
import { withDbFallback } from "@/lib/db/with-db";
import type {
  CreateWorkoutTemplateInput,
  TemplateExerciseInput,
  UpdateWorkoutTemplateInput,
  WorkoutTemplateDetail,
  WorkoutTemplateSummary,
} from "@/types/schemas/workout-template";

async function loadTemplateDetail(
  templateId: string,
  userId: string,
): Promise<WorkoutTemplateDetail | null> {
  const [template] = await db
    .select()
    .from(workoutTemplates)
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId),
      ),
    )
    .limit(1);

  if (!template) return null;

  const rows = await db
    .select({
      id: templateExercises.id,
      exerciseId: templateExercises.exerciseId,
      orderIndex: templateExercises.orderIndex,
      targetSets: templateExercises.targetSets,
      targetReps: templateExercises.targetReps,
      targetWeightKg: templateExercises.targetWeightKg,
      notes: templateExercises.notes,
      exerciseName: exercises.name,
      exerciseCategory: exercises.category,
      exerciseMuscleGroup: exercises.muscleGroup,
      exerciseEquipment: exercises.equipment,
    })
    .from(templateExercises)
    .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
    .where(eq(templateExercises.templateId, templateId))
    .orderBy(asc(templateExercises.orderIndex));

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    source: template.source,
    isFavorite: template.isFavorite,
    exerciseCount: rows.length,
    updatedAt: template.updatedAt,
    exercises: rows.map((row) => ({
      id: row.id,
      exerciseId: row.exerciseId,
      orderIndex: row.orderIndex,
      targetSets: row.targetSets,
      targetReps: row.targetReps,
      targetWeightKg:
        row.targetWeightKg != null ? Number(row.targetWeightKg) : null,
      notes: row.notes,
      exercise: {
        id: row.exerciseId,
        name: row.exerciseName,
        category: row.exerciseCategory,
        muscleGroup: row.exerciseMuscleGroup,
        equipment: row.exerciseEquipment,
      },
    })),
  };
}

async function insertTemplateExercises(
  templateId: string,
  items: TemplateExerciseInput[],
) {
  if (items.length === 0) return;
  await db.insert(templateExercises).values(
    items.map((item) => ({
      templateId,
      exerciseId: item.exerciseId,
      orderIndex: item.orderIndex,
      targetSets: item.targetSets ?? null,
      targetReps: item.targetReps ?? null,
      targetWeightKg:
        item.targetWeightKg != null ? String(item.targetWeightKg) : null,
      notes: item.notes ?? null,
    })),
  );
}

export async function listWorkoutTemplatesForUser(
  userId: string,
): Promise<WorkoutTemplateSummary[]> {
  return withDbFallback(
    "listWorkoutTemplatesForUser",
    async () => {
      const rows = await db
        .select({
          id: workoutTemplates.id,
          name: workoutTemplates.name,
          description: workoutTemplates.description,
          source: workoutTemplates.source,
          isFavorite: workoutTemplates.isFavorite,
          updatedAt: workoutTemplates.updatedAt,
          exerciseCount: sql<number>`count(${templateExercises.id})::int`,
        })
        .from(workoutTemplates)
        .leftJoin(
          templateExercises,
          eq(templateExercises.templateId, workoutTemplates.id),
        )
        .where(eq(workoutTemplates.userId, userId))
        .groupBy(workoutTemplates.id)
        .orderBy(
          desc(workoutTemplates.isFavorite),
          desc(workoutTemplates.updatedAt),
        );

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        source: row.source,
        isFavorite: row.isFavorite,
        exerciseCount: row.exerciseCount,
        updatedAt: row.updatedAt,
      }));
    },
    [],
  );
}

export async function getWorkoutTemplateForUser(
  templateId: string,
  userId: string,
): Promise<WorkoutTemplateDetail | null> {
  return withDbFallback(
    "getWorkoutTemplateForUser",
    () => loadTemplateDetail(templateId, userId),
    null,
  );
}

export async function createWorkoutTemplate(
  userId: string,
  input: CreateWorkoutTemplateInput,
): Promise<WorkoutTemplateDetail> {
  const [created] = await db
    .insert(workoutTemplates)
    .values({
      userId,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      source: input.source ?? "manual",
    })
    .returning();

  await insertTemplateExercises(created.id, input.exercises);

  const detail = await loadTemplateDetail(created.id, userId);
  if (!detail) throw new Error("TEMPLATE_CREATE_FAILED");
  return detail;
}

export async function updateWorkoutTemplate(
  templateId: string,
  userId: string,
  input: UpdateWorkoutTemplateInput,
): Promise<WorkoutTemplateDetail | null> {
  const [existing] = await db
    .select({ id: workoutTemplates.id })
    .from(workoutTemplates)
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId),
      ),
    )
    .limit(1);

  if (!existing) return null;

  await db
    .update(workoutTemplates)
    .set({
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() ?? null }
        : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      updatedAt: new Date(),
    })
    .where(eq(workoutTemplates.id, templateId));

  if (input.exercises) {
    await db
      .delete(templateExercises)
      .where(eq(templateExercises.templateId, templateId));
    await insertTemplateExercises(templateId, input.exercises);
  }

  return loadTemplateDetail(templateId, userId);
}

export async function deleteWorkoutTemplateForUser(
  templateId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(workoutTemplates)
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId),
      ),
    )
    .returning({ id: workoutTemplates.id });

  return result.length > 0;
}

export async function duplicateWorkoutTemplateForUser(
  templateId: string,
  userId: string,
  name?: string,
): Promise<WorkoutTemplateDetail | null> {
  const source = await loadTemplateDetail(templateId, userId);
  if (!source) return null;

  return createWorkoutTemplate(userId, {
    name: name?.trim() || `${source.name} (copy)`,
    description: source.description,
    source: "manual",
    exercises: source.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      orderIndex: ex.orderIndex,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      notes: ex.notes,
    })),
  });
}

export async function setWorkoutTemplateFavorite(
  templateId: string,
  userId: string,
  isFavorite: boolean,
): Promise<boolean> {
  const result = await db
    .update(workoutTemplates)
    .set({ isFavorite, updatedAt: new Date() })
    .where(
      and(
        eq(workoutTemplates.id, templateId),
        eq(workoutTemplates.userId, userId),
      ),
    )
    .returning({ id: workoutTemplates.id });

  return result.length > 0;
}
