import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { DEFAULT_EXERCISES } from "@/lib/exercises/default-exercises";

const hasDb = Boolean(process.env.DATABASE_URL);
const testUserId =
  process.env.TEST_USER_ID ?? "b1000001-0000-4000-8000-000000000099";

describe.skipIf(!hasDb)("workout flow integration", () => {
  let workoutId: string | undefined;

  beforeAll(async () => {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/lib/db/schema");
    const { seedDefaultExercisesIfEmpty } = await import(
      "@/lib/db/queries/exercises"
    );

    await db
      .insert(users)
      .values({
        id: testUserId,
        email: `integration-${testUserId}@fitness-tracker.test`,
      })
      .onConflictDoNothing();

    await seedDefaultExercisesIfEmpty();
  });

  afterAll(async () => {
    if (!workoutId) return;
    const { deleteWorkoutForUser } = await import("@/lib/db/queries/workouts");
    await deleteWorkoutForUser(workoutId, testUserId);
  });

  it("persists a completed workout and loads detail", async () => {
    const { db } = await import("@/lib/db");
    const { persistCompletedWorkout } = await import(
      "@/lib/db/persist-completed-workout"
    );
    const { getWorkoutDetail } = await import("@/lib/db/queries/workouts");

    const exerciseId = DEFAULT_EXERCISES[0].id;
    const startedAt = "2026-06-02T10:00:00.000Z";
    const endedAt = "2026-06-02T11:00:00.000Z";

    const session = {
      id: "c1000001-0000-4000-8000-000000000001",
      userId: testUserId,
      title: "Integration Test Workout",
      date: "2026-06-02",
      notes: null,
      feeling: "good" as const,
      startedAt,
      endedAt,
      totalPausedMs: 0,
      exercises: [
        {
          id: "c1000001-0000-4000-8000-000000000002",
          exerciseId,
          name: DEFAULT_EXERCISES[0].name,
          category: "strength",
          muscleGroup: "chest",
          equipment: "barbell",
          orderIndex: 0,
          sets: [
            {
              id: "c1000001-0000-4000-8000-000000000003",
              reps: 10,
              weightKg: 60,
              rpe: 8,
              restSeconds: 90,
              isWarmup: false,
              completedAt: null,
            },
          ],
        },
      ],
    };

    workoutId = await db.transaction((tx) =>
      persistCompletedWorkout(tx, testUserId, session),
    );

    const detail = await getWorkoutDetail(workoutId, testUserId);

    expect(detail).not.toBeNull();
    expect(detail?.title).toBe("Integration Test Workout");
    expect(detail?.feeling).toBe("good");
    expect(detail?.duration).toBe(3600);
    expect(detail?.workoutExercises).toHaveLength(1);
    expect(detail?.workoutExercises[0].sets).toHaveLength(1);
    expect(detail?.workoutExercises[0].sets[0].reps).toBe(10);
    expect(detail?.workoutExercises[0].sets[0].weightKg).toBe("60.00");
  });
});
