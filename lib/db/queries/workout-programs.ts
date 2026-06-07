import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  programDays,
  workoutPrograms,
  workoutTemplates,
} from "@/lib/db/schema";
import { withDbFallback } from "@/lib/db/with-db";
import type {
  CreateWorkoutProgramInput,
  WorkoutProgramDetail,
  WorkoutProgramSummary,
} from "@/types/schemas/workout-program";

async function loadProgramDetail(
  programId: string,
  userId: string,
): Promise<WorkoutProgramDetail | null> {
  const [program] = await db
    .select()
    .from(workoutPrograms)
    .where(
      and(
        eq(workoutPrograms.id, programId),
        eq(workoutPrograms.userId, userId),
      ),
    )
    .limit(1);

  if (!program) return null;

  const days = await db
    .select({
      id: programDays.id,
      dayOfWeek: programDays.dayOfWeek,
      templateId: programDays.templateId,
      isRestDay: programDays.isRestDay,
      label: programDays.label,
      templateName: workoutTemplates.name,
    })
    .from(programDays)
    .leftJoin(workoutTemplates, eq(programDays.templateId, workoutTemplates.id))
    .where(eq(programDays.programId, programId))
    .orderBy(asc(programDays.dayOfWeek));

  return {
    id: program.id,
    name: program.name,
    description: program.description,
    source: program.source,
    isActive: program.isActive,
    dayCount: days.length,
    days: days.map((day) => ({
      id: day.id,
      dayOfWeek: day.dayOfWeek,
      templateId: day.templateId,
      isRestDay: day.isRestDay,
      label: day.label,
      templateName: day.templateName,
    })),
  };
}

export async function listWorkoutProgramsForUser(
  userId: string,
): Promise<WorkoutProgramSummary[]> {
  return withDbFallback(
    "listWorkoutProgramsForUser",
    async () => {
      const rows = await db
        .select({
          id: workoutPrograms.id,
          name: workoutPrograms.name,
          description: workoutPrograms.description,
          source: workoutPrograms.source,
          isActive: workoutPrograms.isActive,
          dayCount: sql<number>`count(${programDays.id})::int`,
        })
        .from(workoutPrograms)
        .leftJoin(programDays, eq(programDays.programId, workoutPrograms.id))
        .where(eq(workoutPrograms.userId, userId))
        .groupBy(workoutPrograms.id)
        .orderBy(desc(workoutPrograms.isActive), desc(workoutPrograms.updatedAt));

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        source: row.source,
        isActive: row.isActive,
        dayCount: row.dayCount,
      }));
    },
    [],
  );
}

export async function getActiveWorkoutProgramForUser(
  userId: string,
): Promise<WorkoutProgramDetail | null> {
  return withDbFallback(
    "getActiveWorkoutProgramForUser",
    async () => {
      const [program] = await db
        .select({ id: workoutPrograms.id })
        .from(workoutPrograms)
        .where(
          and(
            eq(workoutPrograms.userId, userId),
            eq(workoutPrograms.isActive, true),
          ),
        )
        .limit(1);

      if (!program) return null;
      return loadProgramDetail(program.id, userId);
    },
    null,
  );
}

export async function createWorkoutProgram(
  userId: string,
  input: CreateWorkoutProgramInput,
): Promise<WorkoutProgramDetail> {
  if (input.activate) {
    await db
      .update(workoutPrograms)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(workoutPrograms.userId, userId));
  }

  const [created] = await db
    .insert(workoutPrograms)
    .values({
      userId,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      source: input.source ?? "manual",
      isActive: input.activate ?? false,
    })
    .returning();

  await db.insert(programDays).values(
    input.days.map((day) => ({
      programId: created.id,
      dayOfWeek: day.dayOfWeek,
      templateId: day.templateId ?? null,
      isRestDay: day.isRestDay ?? false,
      label: day.label ?? null,
    })),
  );

  const detail = await loadProgramDetail(created.id, userId);
  if (!detail) throw new Error("PROGRAM_CREATE_FAILED");
  return detail;
}

export async function activateWorkoutProgram(
  programId: string,
  userId: string,
): Promise<WorkoutProgramDetail | null> {
  const [existing] = await db
    .select({ id: workoutPrograms.id })
    .from(workoutPrograms)
    .where(
      and(
        eq(workoutPrograms.id, programId),
        eq(workoutPrograms.userId, userId),
      ),
    )
    .limit(1);

  if (!existing) return null;

  await db
    .update(workoutPrograms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(workoutPrograms.userId, userId));

  await db
    .update(workoutPrograms)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(workoutPrograms.id, programId));

  return loadProgramDetail(programId, userId);
}

export async function getWorkoutProgramForUser(
  programId: string,
  userId: string,
): Promise<WorkoutProgramDetail | null> {
  return withDbFallback(
    "getWorkoutProgramForUser",
    () => loadProgramDetail(programId, userId),
    null,
  );
}

export async function deleteWorkoutProgramForUser(
  programId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(workoutPrograms)
    .where(
      and(
        eq(workoutPrograms.id, programId),
        eq(workoutPrograms.userId, userId),
      ),
    )
    .returning({ id: workoutPrograms.id });

  return result.length > 0;
}

export async function getProgramDayTemplateForDate(
  userId: string,
  planDate: string,
): Promise<{ templateId: string | null; isRestDay: boolean; label: string | null } | null> {
  const program = await getActiveWorkoutProgramForUser(userId);
  if (!program) return null;

  const date = new Date(`${planDate}T12:00:00`);
  const dayOfWeek = date.getDay();

  const day = program.days.find((d) => d.dayOfWeek === dayOfWeek);
  if (!day) return null;

  return {
    templateId: day.templateId,
    isRestDay: day.isRestDay,
    label: day.label,
  };
}
