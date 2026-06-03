import { describe, expect, it } from "vitest";

import {
  workoutSessionReducer,
  type SessionReducerDeps,
} from "@/lib/workout/session-reducer";
import {
  canTransitionWorkoutSession,
  createDefaultRestTimer,
  getWorkoutSessionStatus,
} from "@/types/workout-session";

const EXERCISE_ID = "a1000001-0000-4000-8000-000000000001";

function createDeps(
  overrides?: Partial<SessionReducerDeps>,
): SessionReducerDeps {
  let ms = 1_700_000_000_000;
  let tick = 0;
  return {
    nowMs: () => ms,
    nowIso: () => new Date(ms).toISOString(),
    createId: () => `00000000-0000-4000-8000-${String(++tick).padStart(12, "0")}`,
    ...overrides,
  };
}

describe("workout session transitions", () => {
  it("allows idle → active → paused → active → completed", () => {
    expect(canTransitionWorkoutSession("idle", "active")).toBe(true);
    expect(canTransitionWorkoutSession("active", "paused")).toBe(true);
    expect(canTransitionWorkoutSession("paused", "active")).toBe(true);
    expect(canTransitionWorkoutSession("active", "completed")).toBe(true);
    expect(canTransitionWorkoutSession("completed", "active")).toBe(false);
  });
});

describe("workoutSessionReducer", () => {
  const deps = createDeps();
  const userId = "b1000001-0000-4000-8000-000000000099";

  it("starts an active session", () => {
    const { session } = workoutSessionReducer(
      null,
      {
        type: "START",
        input: {
          userId,
          title: "  Push day  ",
          date: "2026-06-02",
          notes: " felt good ",
        },
      },
      deps,
    );

    expect(session?.status).toBe("active");
    expect(session?.title).toBe("Push day");
    expect(session?.notes).toBe("felt good");
    expect(session?.exercises).toEqual([]);
    expect(getWorkoutSessionStatus(session)).toBe("active");
  });

  it("accumulates paused time on resume", () => {
    let session = workoutSessionReducer(
      null,
      {
        type: "START",
        input: { userId, title: "Legs", date: "2026-06-02" },
      },
      deps,
    ).session!;

    session = workoutSessionReducer(session, { type: "PAUSE" }, deps).session!;
    expect(session.status).toBe("paused");
    expect(session.pausedAt).toBeTruthy();

    const resumeDeps = createDeps({
      nowMs: () => 1_700_000_120_000,
      nowIso: () => new Date(1_700_000_120_000).toISOString(),
      createId: deps.createId,
    });

    session = workoutSessionReducer(
      session,
      { type: "RESUME" },
      resumeDeps,
    ).session!;

    expect(session.status).toBe("active");
    expect(session.totalPausedMs).toBe(120_000);
  });

  it("adds exercise and sets only while active", () => {
    let session = workoutSessionReducer(
      null,
      {
        type: "START",
        input: { userId, title: "Pull", date: "2026-06-02" },
      },
      deps,
    ).session!;

    const { session: withEx, exerciseId } = workoutSessionReducer(session, {
      type: "ADD_EXERCISE",
      exercise: {
        exerciseId: EXERCISE_ID,
        name: "Barbell Row",
        category: "strength",
        muscleGroup: "back",
        equipment: "barbell",
      },
    }, deps);

    expect(withEx?.exercises).toHaveLength(1);
    expect(exerciseId).toBeTruthy();

    const { setId } = workoutSessionReducer(withEx!, {
      type: "ADD_SET",
      exerciseId: exerciseId!,
      partial: { reps: 8, weightKg: 60 },
    }, deps);

    expect(setId).toBeTruthy();

    session = workoutSessionReducer(withEx!, { type: "PAUSE" }, deps).session!;

    expect(() =>
      workoutSessionReducer(session, {
        type: "ADD_EXERCISE",
        exercise: {
          exerciseId: EXERCISE_ID,
          name: "Other",
          category: "strength",
          muscleGroup: "back",
          equipment: null,
        },
      }, deps),
    ).toThrow(/active/);
  });

  it("keeps at least one set when removing the last set", () => {
    const { session: started } = workoutSessionReducer(
      null,
      {
        type: "START",
        input: { userId, title: "Test", date: "2026-06-02" },
      },
      deps,
    );

    const { session: withEx, exerciseId } = workoutSessionReducer(
      started!,
      {
        type: "ADD_EXERCISE",
        exercise: {
          exerciseId: EXERCISE_ID,
          name: "Squat",
          category: "strength",
          muscleGroup: "legs",
          equipment: "barbell",
        },
      },
      deps,
    );

    const setId = withEx!.exercises[0].sets[0].id;
    const { session: afterRemove } = workoutSessionReducer(withEx!, {
      type: "REMOVE_SET",
      exerciseId: exerciseId!,
      setId,
    }, deps);

    expect(afterRemove?.exercises[0].sets).toHaveLength(1);
    expect(afterRemove?.exercises[0].sets[0].id).not.toBe(setId);
  });

  it("completes and discards sessions", () => {
    const { session: active } = workoutSessionReducer(
      null,
      {
        type: "START",
        input: { userId, title: "Done", date: "2026-06-02" },
      },
      deps,
    );

    const { session: completed } = workoutSessionReducer(active!, {
      type: "COMPLETE",
      input: { feeling: "good" },
    }, deps);

    expect(completed?.status).toBe("completed");
    expect(completed?.feeling).toBe("good");
    expect(completed?.restTimer).toEqual(createDefaultRestTimer());

    const { session: discarded } = workoutSessionReducer(active!, {
      type: "DISCARD",
    }, deps);
    expect(discarded).toBeNull();
  });
});
