import type { WorkoutDetail } from "@/lib/db/queries/workouts";
import type { SaveWorkoutSessionInput } from "@/types/schemas/workout";

export function workoutDetailToEditableSession(
  workout: WorkoutDetail,
  userId: string,
): SaveWorkoutSessionInput {
  const startedAt =
    workout.startTime?.toISOString() ?? new Date().toISOString();
  const endedAt = workout.endTime?.toISOString() ?? startedAt;

  return {
    id: workout.id,
    userId,
    title: workout.title,
    date: workout.date,
    notes: null,
    feeling: workout.feeling,
    startedAt,
    endedAt,
    totalPausedMs: 0,
    exercises: workout.workoutExercises.map((we, index) => ({
      id: crypto.randomUUID(),
      exerciseId: we.exerciseId,
      name: we.exercise.name,
      category: we.exercise.category,
      muscleGroup: we.exercise.muscleGroup,
      equipment: we.exercise.equipment,
      orderIndex: index,
      sets:
        we.sets.length > 0
          ? we.sets.map((s) => ({
              id: crypto.randomUUID(),
              reps: s.reps,
              weightKg: s.weightKg != null ? Number(s.weightKg) : null,
              rpe: s.rpe,
              restSeconds: s.restSeconds,
              isWarmup: s.isWarmup,
              completedAt: null,
            }))
          : [
              {
                id: crypto.randomUUID(),
                reps: null,
                weightKg: null,
                rpe: null,
                restSeconds: 90,
                isWarmup: false,
                completedAt: null,
              },
            ],
    })),
  };
}
