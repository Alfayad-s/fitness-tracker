import { and, eq, gte, lte, asc } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  dailyWorkoutPlans,
  exercises,
  templateExercises,
  workoutTemplates,
} from "@/lib/db/schema";
import { withDbFallback } from "@/lib/db/with-db";
import type {
  DailyPlanExercise,
  DailyWorkoutPlanDetail,
  WorkoutPlanPatch,
} from "@/types/schemas/daily-plan";

async function loadPlanExercises(
  templateId: string | null,
): Promise<DailyPlanExercise[]> {
  if (!templateId) return [];

  const rows = await db
    .select({
      exerciseId: templateExercises.exerciseId,
      exerciseName: exercises.name,
      muscleGroup: exercises.muscleGroup,
      targetSets: templateExercises.targetSets,
      targetReps: templateExercises.targetReps,
      targetWeightKg: templateExercises.targetWeightKg,
      notes: templateExercises.notes,
    })
    .from(templateExercises)
    .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
    .where(eq(templateExercises.templateId, templateId))
    .orderBy(templateExercises.orderIndex);

  return rows.map((row) => ({
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseName,
    muscleGroup: row.muscleGroup,
    targetSets: row.targetSets,
    targetReps: row.targetReps,
    targetWeightKg:
      row.targetWeightKg != null ? Number(row.targetWeightKg) : null,
    notes: row.notes,
  }));
}

async function mapPlanRow(
  row: typeof dailyWorkoutPlans.$inferSelect,
): Promise<DailyWorkoutPlanDetail> {
  return {
    id: row.id,
    planDate: row.planDate,
    templateId: row.templateId,
    title: row.title,
    status: row.status,
    aiRationale: row.aiRationale,
    exercises: await loadPlanExercises(row.templateId),
  };
}

export async function getDailyPlanForUser(
  userId: string,
  planDate: string,
): Promise<DailyWorkoutPlanDetail | null> {
  return withDbFallback(
    "getDailyPlanForUser",
    async () => {
      const [row] = await db
        .select()
        .from(dailyWorkoutPlans)
        .where(
          and(
            eq(dailyWorkoutPlans.userId, userId),
            eq(dailyWorkoutPlans.planDate, planDate),
          ),
        )
        .limit(1);

      if (!row) return null;
      return mapPlanRow(row);
    },
    null,
  );
}

export async function upsertDailyPlanForUser(
  userId: string,
  planDate: string,
  data: {
    title: string;
    templateId?: string | null;
    status?: DailyWorkoutPlanDetail["status"];
    aiRationale?: string | null;
  },
): Promise<DailyWorkoutPlanDetail> {
  const [existing] = await db
    .select({ id: dailyWorkoutPlans.id })
    .from(dailyWorkoutPlans)
    .where(
      and(
        eq(dailyWorkoutPlans.userId, userId),
        eq(dailyWorkoutPlans.planDate, planDate),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(dailyWorkoutPlans)
      .set({
        title: data.title,
        templateId: data.templateId ?? null,
        status: data.status ?? "suggested",
        aiRationale: data.aiRationale ?? null,
      })
      .where(eq(dailyWorkoutPlans.id, existing.id))
      .returning();
    return mapPlanRow(updated);
  }

  const [created] = await db
    .insert(dailyWorkoutPlans)
    .values({
      userId,
      planDate,
      title: data.title,
      templateId: data.templateId ?? null,
      status: data.status ?? "suggested",
      aiRationale: data.aiRationale ?? null,
    })
    .returning();

  return mapPlanRow(created);
}

export async function updateDailyPlanStatus(
  userId: string,
  planDate: string,
  status: DailyWorkoutPlanDetail["status"],
): Promise<DailyWorkoutPlanDetail | null> {
  const [updated] = await db
    .update(dailyWorkoutPlans)
    .set({ status })
    .where(
      and(
        eq(dailyWorkoutPlans.userId, userId),
        eq(dailyWorkoutPlans.planDate, planDate),
      ),
    )
    .returning();

  if (!updated) return null;
  return mapPlanRow(updated);
}

export async function applyWorkoutPlanPatch(
  userId: string,
  patch: WorkoutPlanPatch,
  resolvedTemplateId?: string | null,
): Promise<DailyWorkoutPlanDetail> {
  const existing = await getDailyPlanForUser(userId, patch.planDate);

  let templateId = resolvedTemplateId ?? existing?.templateId ?? null;
  let title = patch.title ?? existing?.title ?? "Workout";
  let exercises = existing?.exercises ?? [];

  if (patch.replaceExercises) {
    exercises = patch.replaceExercises;
  } else {
    if (patch.addExercises?.length) {
      exercises = [...exercises, ...patch.addExercises];
    }
    if (patch.removeExerciseNames?.length) {
      const remove = new Set(
        patch.removeExerciseNames.map((n) => n.toLowerCase()),
      );
      exercises = exercises.filter(
        (ex) => !remove.has(ex.exerciseName.toLowerCase()),
      );
    }
  }

  const exercisesChanged = Boolean(
    patch.replaceExercises ||
      patch.addExercises?.length ||
      patch.removeExerciseNames?.length,
  );

  if (exercisesChanged && exercises.length > 0) {
    if (!templateId) {
      const [template] = await db
        .insert(workoutTemplates)
        .values({
          userId,
          name: title,
          source: "ai",
        })
        .returning();

      templateId = template.id;
    }

    await db
      .delete(templateExercises)
      .where(eq(templateExercises.templateId, templateId!));

    await db.insert(templateExercises).values(
      exercises.map((ex, index) => ({
        templateId: templateId!,
        exerciseId: ex.exerciseId!,
        orderIndex: index,
        targetSets: ex.targetSets ?? null,
        targetReps: ex.targetReps ?? null,
        targetWeightKg:
          ex.targetWeightKg != null ? String(ex.targetWeightKg) : null,
        notes: ex.notes ?? null,
      })),
    );
  }

  return upsertDailyPlanForUser(userId, patch.planDate, {
    title,
    templateId,
    status: patch.status ?? existing?.status ?? "suggested",
    aiRationale: existing?.aiRationale ?? null,
  });
}

export async function listUpcomingDailyPlansForUser(
  userId: string,
  fromDate: string,
  toDate: string,
): Promise<DailyWorkoutPlanDetail[]> {
  return withDbFallback(
    "listUpcomingDailyPlansForUser",
    async () => {
      const rows = await db
        .select()
        .from(dailyWorkoutPlans)
        .where(
          and(
            eq(dailyWorkoutPlans.userId, userId),
            gte(dailyWorkoutPlans.planDate, fromDate),
            lte(dailyWorkoutPlans.planDate, toDate),
          ),
        )
        .orderBy(asc(dailyWorkoutPlans.planDate));

      return Promise.all(rows.map((row) => mapPlanRow(row)));
    },
    [],
  );
}

export async function listRecentDailyPlansForUser(
  userId: string,
  limit = 7,
): Promise<DailyWorkoutPlanDetail[]> {
  return withDbFallback(
    "listRecentDailyPlansForUser",
    async () => {
      const rows = await db
        .select()
        .from(dailyWorkoutPlans)
        .where(eq(dailyWorkoutPlans.userId, userId))
        .orderBy(dailyWorkoutPlans.planDate)
        .limit(limit);

      return Promise.all(rows.map((row) => mapPlanRow(row)));
    },
    [],
  );
}
