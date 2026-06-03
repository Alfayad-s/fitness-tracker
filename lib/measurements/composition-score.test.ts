import { describe, expect, it } from "vitest";

import { computeCompositionScore } from "@/lib/measurements/composition-score";

describe("computeCompositionScore", () => {
  it("returns a score when core BMA fields are present", () => {
    const score = computeCompositionScore({
      weightKg: "66.7",
      bodyFatPercent: "30.7",
      bodyWaterPercent: "30.6",
      proteinKg: "9.1",
      muscleMassKg: "29.5",
      skeletalMuscleMassKg: null,
      boneMassKg: "3.15",
      bmi: "24.5",
    });

    expect(score).not.toBeNull();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("returns null without weight", () => {
    expect(
      computeCompositionScore({
        weightKg: null,
        bodyFatPercent: "20",
        bodyWaterPercent: null,
        proteinKg: null,
        muscleMassKg: null,
        skeletalMuscleMassKg: null,
        boneMassKg: null,
        bmi: null,
      }),
    ).toBeNull();
  });
});
