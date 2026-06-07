import type { WorkoutDetail } from "@/lib/db/queries/workouts";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";
import type { CreateWorkoutTemplateInput } from "@/types/schemas/workout-template";

export function workoutDetailToTemplateInput(
  workout: WorkoutDetail,
  name?: string,
): CreateWorkoutTemplateInput {
  return {
    name: name?.trim() || workout.title,
    description: null,
    source: "manual",
    exercises: workout.workoutExercises.map((we, index) => {
      const loggedSets = we.sets.filter(
        (s) => (s.reps != null && s.reps > 0) || (s.weightKg != null && Number(s.weightKg) > 0),
      );
      const best = loggedSets.reduce<(typeof we.sets)[number] | null>(
        (acc, set) => {
          if (!acc) return set;
          const accWeight = acc.weightKg != null ? Number(acc.weightKg) : 0;
          const setWeight = set.weightKg != null ? Number(set.weightKg) : 0;
          return setWeight >= accWeight ? set : acc;
        },
        null,
      );

      return {
        exerciseId: we.exerciseId,
        orderIndex: index,
        targetSets: loggedSets.length > 0 ? loggedSets.length : 3,
        targetReps: best?.reps ?? null,
        targetWeightKg:
          best?.weightKg != null ? Number(best.weightKg) : null,
        notes: null,
      };
    }),
  };
}

export function templateDetailToCreateInput(
  template: WorkoutTemplateDetail,
  name?: string,
): CreateWorkoutTemplateInput {
  return {
    name: name?.trim() || template.name,
    description: template.description,
    source: template.source,
    exercises: template.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      orderIndex: ex.orderIndex,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      targetWeightKg: ex.targetWeightKg,
      notes: ex.notes,
    })),
  };
}
