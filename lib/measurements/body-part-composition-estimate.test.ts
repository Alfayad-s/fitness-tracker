import { describe, expect, it } from "vitest";

import {
  buildAllPartCompositionEstimates,
  estimatePartComposition,
} from "@/lib/measurements/body-part-composition-estimate";

const scan = {
  weightKg: 66.7,
  bodyWaterKg: 34,
  bodyFatKg: 6.1,
  proteinKg: 3.2,
  boneMassKg: 2.4,
};

describe("estimatePartComposition", () => {
  it("distributes each metric across body regions", () => {
    const estimate = estimatePartComposition({
      partId: "left_leg_upper",
      label: "Left thigh",
      ...scan,
    });

    expect(estimate).not.toBeNull();
    expect(estimate?.metrics).toHaveLength(4);
    expect(estimate?.metrics.map((metric) => metric.id)).toEqual([
      "bodyWater",
      "bodyFat",
      "protein",
      "boneMass",
    ]);
    expect(estimate?.estimatedPartMassKg).toBeGreaterThan(0);
  });

  it("puts more fat in the core than the head", () => {
    const core = estimatePartComposition({
      partId: "stomach",
      label: "Core",
      ...scan,
    });
    const head = estimatePartComposition({
      partId: "head",
      label: "Head",
      ...scan,
    });

    const coreFat = core?.metrics.find((metric) => metric.id === "bodyFat");
    const headFat = head?.metrics.find((metric) => metric.id === "bodyFat");

    expect(coreFat?.massKg ?? 0).toBeGreaterThan(headFat?.massKg ?? 0);
  });
});

describe("buildAllPartCompositionEstimates", () => {
  it("keeps total distributed mass close to scan totals", () => {
    const labels = {
      head: "Head",
      chest: "Chest",
      stomach: "Core",
      left_shoulder: "Left shoulder",
      right_shoulder: "Right shoulder",
      left_arm: "Left arm",
      right_arm: "Right arm",
      left_hand: "Left hand",
      right_hand: "Right hand",
      left_leg_upper: "Left thigh",
      right_leg_upper: "Right thigh",
      left_leg_lower: "Left shin",
      right_leg_lower: "Right shin",
      left_foot: "Left foot",
      right_foot: "Right foot",
    } as const;

    const estimates = buildAllPartCompositionEstimates({
      ...scan,
      partLabels: labels,
    });

    const totals = {
      bodyWater: 0,
      bodyFat: 0,
      protein: 0,
      boneMass: 0,
    };

    for (const estimate of Object.values(estimates)) {
      for (const metric of estimate?.metrics ?? []) {
        totals[metric.id] += metric.massKg;
      }
    }

    expect(totals.bodyWater).toBeCloseTo(scan.bodyWaterKg, 0);
    expect(totals.bodyFat).toBeCloseTo(scan.bodyFatKg, 0);
    expect(totals.protein).toBeCloseTo(scan.proteinKg, 0);
    expect(totals.boneMass).toBeCloseTo(scan.boneMassKg, 0);
  });
});
