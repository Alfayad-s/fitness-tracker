import { describe, expect, it } from "vitest";

import {
  calculateDailyNutritionTargets,
  WATER_BOTTLE_ML,
} from "@/lib/measurements/daily-nutrition-targets";

describe("calculateDailyNutritionTargets", () => {
  it("returns protein, calories, and water for a logged weight", () => {
    const result = calculateDailyNutritionTargets({
      profile: {
        gender: "male",
        heightCm: "175",
        goalType: "gain_muscle",
      },
      measurement: {
        weightKg: "70",
        bodyFatPercent: "20",
      } as never,
    });

    expect(result).not.toBeNull();
    expect(result!.proteinGrams).toBeGreaterThan(100);
    expect(result!.caloriesKcal).toBeGreaterThan(2000);
    expect(result!.waterLiters).toBeGreaterThan(2);
    expect(result!.waterBottles * WATER_BOTTLE_ML).toBeCloseTo(result!.waterMl, 0);
  });

  it("returns null without weight", () => {
    expect(
      calculateDailyNutritionTargets({
        profile: { gender: null, heightCm: null, goalType: null },
        measurement: null,
      }),
    ).toBeNull();
  });
});
