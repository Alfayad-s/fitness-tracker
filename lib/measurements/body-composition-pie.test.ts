import { describe, expect, it } from "vitest";

import { buildBodyCompositionPieData } from "@/lib/measurements/body-composition-pie";
import type { BodyMeasurement } from "@/types";

const baseMeasurement: BodyMeasurement = {
  id: "m1",
  userId: "u1",
  recordedAt: new Date("2024-06-01"),
  weightKg: "70",
  bodyFatPercent: "20",
  bodyWaterKg: "28",
  proteinKg: "9.1",
  boneMassKg: "3.1",
  mineralKg: null,
  muscleMassKg: null,
  bmi: null,
  visceralFatLevel: null,
  metabolicAge: null,
  skeletalMuscleMassKg: null,
  bodyWaterPercent: null,
  chestCm: null,
  waistCm: null,
  hipsCm: null,
  bicepsCm: null,
  thighsCm: null,
  notes: null,
  createdAt: new Date("2024-06-01"),
};

describe("buildBodyCompositionPieData", () => {
  it("builds slices for water, fat, bone, and protein", () => {
    const result = buildBodyCompositionPieData(baseMeasurement);

    expect(result).not.toBeNull();
    expect(result?.slices.map((s) => s.id)).toEqual([
      "bodyWater",
      "bodyFat",
      "boneMass",
      "protein",
    ]);
    expect(result?.slices.find((s) => s.id === "bodyFat")?.massKg).toBe(14);
    expect(result?.totalKg).toBe(54.2);
  });

  it("returns null when no composition fields exist", () => {
    expect(
      buildBodyCompositionPieData({
        ...baseMeasurement,
        bodyWaterKg: null,
        proteinKg: null,
        boneMassKg: null,
        bodyFatPercent: null,
        weightKg: null,
      }),
    ).toBeNull();
  });
});
