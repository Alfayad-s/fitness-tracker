import { describe, expect, it } from "vitest";

import {
  buildExercisePrsFromSetRows,
  formatWorkoutDetailForContext,
} from "@/lib/ai/format-user-context";
import type { WorkoutDetail } from "@/lib/db/queries/workouts";

describe("buildExercisePrsFromSetRows", () => {
  it("picks best estimated 1RM per exercise", () => {
    const prs = buildExercisePrsFromSetRows([
      {
        workoutDate: "2025-01-01",
        exerciseId: "ex-1",
        exerciseName: "Bench Press",
        reps: 5,
        weightKg: 80,
        isWarmup: false,
      },
      {
        workoutDate: "2025-01-08",
        exerciseId: "ex-1",
        exerciseName: "Bench Press",
        reps: 3,
        weightKg: 85,
        isWarmup: false,
      },
    ]);

    expect(prs).toHaveLength(1);
    expect(prs[0].exerciseName).toBe("Bench Press");
    expect(prs[0].maxWeightKg).toBe(85);
    expect(prs[0].date).toBe("2025-01-08");
  });
});

describe("formatWorkoutDetailForContext", () => {
  it("includes title, date, and set lines", () => {
    const text = formatWorkoutDetailForContext({
      id: "w1",
      userId: "u1",
      title: "Push",
      date: "2025-06-01",
      startTime: null,
      endTime: null,
      feeling: "good",
      duration: 3600,
      createdAt: new Date(),
      updatedAt: new Date(),
      workoutExercises: [
        {
          id: "we1",
          workoutId: "w1",
          exerciseId: "ex1",
          orderIndex: 0,
          exercise: {
            id: "ex1",
            name: "Squat",
            category: "legs",
            muscleGroup: "quads",
            equipment: "barbell",
            isCustom: false,
            createdBy: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          sets: [
            {
              id: "s1",
              workoutExerciseId: "we1",
              reps: 5,
              weightKg: "100",
              rpe: null,
              restSeconds: null,
              isWarmup: false,
            },
          ],
        },
      ],
    } as WorkoutDetail);

    expect(text).toContain("2025-06-01 | Push");
    expect(text).toContain("Squat: 100kg×5");
  });
});
