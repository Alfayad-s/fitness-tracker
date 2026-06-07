import { describe, expect, it } from "vitest";

import {
  shouldGenerateFullWorkoutPlan,
  shouldViewWorkoutPlanDetails,
} from "@/lib/ai/should-parse-workout-plan";

describe("should-parse-workout-plan", () => {
  it("treats tomorrow workout plan questions as view requests", () => {
    expect(
      shouldViewWorkoutPlanDetails("what is the tomorrow workout plan"),
    ).toBe(true);
    expect(
      shouldViewWorkoutPlanDetails("day after tomorrow what is the workout plan"),
    ).toBe(true);
  });

  it("treats plan-a-workout commands as edits, not views", () => {
    expect(shouldViewWorkoutPlanDetails("plan a leg day for tomorrow")).toBe(
      false,
    );
    expect(shouldGenerateFullWorkoutPlan("plan a leg day for tomorrow")).toBe(
      true,
    );
  });

  it("treats skip and add as edits", () => {
    expect(shouldViewWorkoutPlanDetails("skip tomorrow")).toBe(false);
    expect(shouldViewWorkoutPlanDetails("add bench to tomorrow")).toBe(false);
  });
});
