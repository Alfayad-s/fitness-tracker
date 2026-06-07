import type { DailyPlanExercise } from "@/types/schemas/daily-plan";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";
import type { SessionExercise, SessionSet } from "@/types/workout-session";

function createEmptySet(): SessionSet {
  return {
    id: crypto.randomUUID(),
    reps: null,
    weightKg: null,
    rpe: null,
    restSeconds: 90,
    isWarmup: false,
    completedAt: null,
  };
}

function templateExerciseToSessionExercise(
  item: WorkoutTemplateDetail["exercises"][number],
): SessionExercise {
  const setCount = Math.max(item.targetSets ?? 1, 1);
  const sets: SessionSet[] = Array.from({ length: setCount }, (_, index) => {
    const set = createEmptySet();
    if (index === 0) {
      set.reps = item.targetReps;
      set.weightKg = item.targetWeightKg;
    }
    return set;
  });

  return {
    id: crypto.randomUUID(),
    exerciseId: item.exerciseId,
    name: item.exercise.name,
    category: item.exercise.category,
    muscleGroup: item.exercise.muscleGroup,
    equipment: item.exercise.equipment,
    orderIndex: item.orderIndex,
    sets,
  };
}

export type StartWorkoutFromTemplateInput = {
  userId: string;
  title: string;
  date: string;
  notes?: string | null;
  template: WorkoutTemplateDetail;
};

/** Builds session exercises from a template for START action. */
export function buildExercisesFromTemplate(
  template: WorkoutTemplateDetail,
): SessionExercise[] {
  return template.exercises
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(templateExerciseToSessionExercise);
}

export function buildStartWorkoutFromTemplateInput(
  input: StartWorkoutFromTemplateInput,
) {
  return {
    userId: input.userId,
    title: input.title.trim() || input.template.name,
    date: input.date,
    notes: input.notes?.trim() ?? null,
    exercises: buildExercisesFromTemplate(input.template),
  };
}

function planExerciseToSessionExercise(
  item: DailyPlanExercise,
  orderIndex: number,
): SessionExercise {
  const setCount = Math.max(item.targetSets ?? 1, 1);
  const sets: SessionSet[] = Array.from({ length: setCount }, (_, index) => {
    const set = createEmptySet();
    if (index === 0) {
      set.reps = item.targetReps ?? null;
      set.weightKg = item.targetWeightKg ?? null;
    }
    return set;
  });

  return {
    id: crypto.randomUUID(),
    exerciseId: item.exerciseId!,
    name: item.exerciseName,
    category: "strength",
    muscleGroup: item.muscleGroup ?? "core",
    equipment: null,
    orderIndex,
    sets,
  };
}

export type StartWorkoutFromDailyPlanInput = {
  userId: string;
  plan: {
    planDate: string;
    title: string;
    exercises: DailyPlanExercise[];
  };
  template?: WorkoutTemplateDetail | null;
};

/** Start session from a daily plan (template preferred, plan exercises as fallback). */
export function buildStartWorkoutFromDailyPlanInput(
  input: StartWorkoutFromDailyPlanInput,
) {
  if (input.template) {
    return buildStartWorkoutFromTemplateInput({
      userId: input.userId,
      title: input.plan.title,
      date: input.plan.planDate,
      template: input.template,
    });
  }

  return {
    userId: input.userId,
    title: input.plan.title,
    date: input.plan.planDate,
    notes: null,
    exercises: input.plan.exercises
      .filter((ex) => ex.exerciseId)
      .map((ex, index) => planExerciseToSessionExercise(ex, index)),
  };
}
