import { describe, expect, it } from "vitest";

import {
  buildExercisesFromTemplate,
  buildStartWorkoutFromTemplateInput,
} from "@/lib/workout/template-to-session";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";
import {
  normalizeWorkoutPlanPatch,
  workoutPlanPatchSchema,
} from "@/types/schemas/daily-plan";
import {
  exerciseImportSchema,
  normalizeExerciseImport,
} from "@/types/schemas/exercise-import";

const mockTemplate: WorkoutTemplateDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Push day",
  description: null,
  source: "manual",
  isFavorite: false,
  exerciseCount: 2,
  updatedAt: new Date(),
  exercises: [
    {
      id: "00000000-0000-4000-8000-000000000010",
      exerciseId: "00000000-0000-4000-8000-000000000020",
      orderIndex: 0,
      targetSets: 3,
      targetReps: 8,
      targetWeightKg: 60,
      notes: null,
      exercise: {
        id: "00000000-0000-4000-8000-000000000020",
        name: "Bench Press",
        category: "strength",
        muscleGroup: "chest",
        equipment: "barbell",
      },
    },
    {
      id: "00000000-0000-4000-8000-000000000011",
      exerciseId: "00000000-0000-4000-8000-000000000021",
      orderIndex: 1,
      targetSets: 2,
      targetReps: 12,
      targetWeightKg: null,
      notes: null,
      exercise: {
        id: "00000000-0000-4000-8000-000000000021",
        name: "Lateral Raise",
        category: "strength",
        muscleGroup: "shoulders",
        equipment: "dumbbell",
      },
    },
  ],
};

describe("template-to-session", () => {
  it("builds session exercises with target sets and first-set targets", () => {
    const exercises = buildExercisesFromTemplate(mockTemplate);

    expect(exercises).toHaveLength(2);
    expect(exercises[0].name).toBe("Bench Press");
    expect(exercises[0].sets).toHaveLength(3);
    expect(exercises[0].sets[0].reps).toBe(8);
    expect(exercises[0].sets[0].weightKg).toBe(60);
    expect(exercises[1].sets).toHaveLength(2);
  });

  it("builds start workout input with exercises", () => {
    const input = buildStartWorkoutFromTemplateInput({
      userId: "user-1",
      title: "Push",
      date: "2026-06-03",
      template: mockTemplate,
    });

    expect(input.title).toBe("Push");
    expect(input.exercises).toHaveLength(2);
  });
});

describe("workout plan patch schema", () => {
  it("normalizes add exercise patch", () => {
    const parsed = workoutPlanPatchSchema.parse({
      planDate: "2026-06-03",
      addExercises: [
        {
          exerciseName: "Romanian Deadlift",
          targetSets: 3,
          targetReps: 10,
        },
      ],
    });

    const normalized = normalizeWorkoutPlanPatch(parsed);
    expect(normalized.addExercises?.[0].exerciseName).toBe("Romanian Deadlift");
  });
});

describe("exercise import schema", () => {
  it("normalizes exercise list import", () => {
    const parsed = exerciseImportSchema.parse({
      exercises: [{ name: "Bulgarian Split Squat", muscleGroup: "legs" }],
      applyTo: "catalog",
    });

    const normalized = normalizeExerciseImport(parsed);
    expect(normalized.exercises[0].name).toBe("Bulgarian Split Squat");
    expect(normalized.applyTo).toBe("catalog");
  });
});
