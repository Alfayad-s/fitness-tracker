import { getDailyPlanForUser } from "@/lib/db/queries/daily-plans";
import { getProgramDayTemplateForDate } from "@/lib/db/queries/workout-programs";
import { getWorkoutTemplateForUser } from "@/lib/db/queries/workout-templates";
import type {
  DailyPlanExercise,
  WorkoutPlanPatch,
} from "@/types/schemas/daily-plan";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";

export type WorkoutPlanLoadSource = "saved" | "program" | "none";

export type LoadedWorkoutPlan = {
  patch: WorkoutPlanPatch;
  source: WorkoutPlanLoadSource;
};

function templateToPlanExercises(
  template: WorkoutTemplateDetail,
): DailyPlanExercise[] {
  return template.exercises.map((row) => ({
    exerciseId: row.exerciseId,
    exerciseName: row.exercise.name,
    muscleGroup: row.exercise.muscleGroup,
    targetSets: row.targetSets,
    targetReps: row.targetReps,
    targetWeightKg: row.targetWeightKg,
    notes: row.notes,
  }));
}

function planToPatch(
  planDate: string,
  title: string,
  status: WorkoutPlanPatch["status"],
  exercises: DailyPlanExercise[],
): WorkoutPlanPatch {
  return {
    planDate,
    title,
    status,
    replaceExercises: exercises,
  };
}

export function workoutPlanPatchHasExercises(patch: WorkoutPlanPatch): boolean {
  if (patch.status === "skipped") return true;
  return (patch.replaceExercises?.length ?? patch.addExercises?.length ?? 0) > 0;
}

/** Load an existing saved plan or active-program template for a calendar date. */
export async function loadWorkoutPlanPatchForDate(
  userId: string,
  planDate: string,
): Promise<LoadedWorkoutPlan | null> {
  const saved = await getDailyPlanForUser(userId, planDate);
  if (saved) {
    if (saved.status === "skipped") {
      return {
        source: "saved",
        patch: {
          planDate,
          title: saved.title,
          status: "skipped",
        },
      };
    }

    if (saved.exercises.length > 0) {
      return {
        source: "saved",
        patch: planToPatch(
          planDate,
          saved.title,
          saved.status,
          saved.exercises,
        ),
      };
    }

    if (saved.title.toLowerCase().includes("rest")) {
      return {
        source: "saved",
        patch: {
          planDate,
          title: saved.title,
          status: saved.status,
        },
      };
    }
  }

  const programDay = await getProgramDayTemplateForDate(userId, planDate);
  if (!programDay) return null;

  if (programDay.isRestDay) {
    return {
      source: "program",
      patch: {
        planDate,
        title: programDay.label ?? "Rest day",
        status: "skipped",
      },
    };
  }

  if (!programDay.templateId) return null;

  const template = await getWorkoutTemplateForUser(
    programDay.templateId,
    userId,
  );
  if (!template || template.exercises.length === 0) return null;

  return {
    source: "program",
    patch: planToPatch(
      planDate,
      programDay.label ?? template.name,
      "suggested",
      templateToPlanExercises(template),
    ),
  };
}
