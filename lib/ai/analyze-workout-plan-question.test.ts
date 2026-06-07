import { describe, expect, it } from "vitest";

import { analyzeWorkoutPlanQuestion } from "@/lib/ai/analyze-workout-plan-question";
import { buildWorkoutPlanResponseMeta } from "@/lib/ai/format-rich-workout-plan-response";
import {
  dayAfterTomorrowDateString,
  parsePlanDateHintFromText,
} from "@/lib/workout/plan-dates";

describe("analyze-workout-plan-question", () => {
  const ref = "2026-06-07";

  it("parses day after tomorrow before tomorrow", () => {
    expect(parsePlanDateHintFromText("day after tomorrow workout plan", ref)).toBe(
      dayAfterTomorrowDateString(ref),
    );
    expect(parsePlanDateHintFromText("day after tomorrow workout plan", ref)).toBe(
      "2026-06-09",
    );
  });

  it("classifies day-after-tomorrow lookup as view", () => {
    const analysis = analyzeWorkoutPlanQuestion(
      "day after tomorrow what is the workout plan",
      ref,
    );
    expect(analysis.intent).toBe("view");
    expect(analysis.planDate).toBe("2026-06-09");
    expect(analysis.dateLabel).toBe("Day after tomorrow");
  });

  it("builds rich intro for program workout", () => {
    const analysis = analyzeWorkoutPlanQuestion(
      "day after tomorrow what is the workout plan",
      ref,
    );
    const meta = buildWorkoutPlanResponseMeta(
      analysis,
      {
        planDate: "2026-06-09",
        title: "Push A",
        status: "suggested",
        replaceExercises: [
          {
            exerciseName: "Barbell Bench Press",
            muscleGroup: "chest",
            targetSets: 4,
            targetReps: 8,
          },
        ],
      },
      "program",
    );
    expect(meta.intro).toContain("Push A");
    expect(meta.intro).toContain("active weekly program");
    expect(meta.isRestDay).toBe(false);
  });
});
