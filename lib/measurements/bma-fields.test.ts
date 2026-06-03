import { describe, expect, it } from "vitest";

import { bmaExtractionToMeasurement } from "@/lib/ai/bma-to-measurement";
import { normalizeBmaExtraction } from "@/types/schemas/bma-report";

describe("normalizeBmaExtraction", () => {
  it("promotes extraMetrics keys to first-class BMA fields", () => {
    const normalized = normalizeBmaExtraction({
      summary: "Test",
      weightKg: 66.7,
      bodyFatPercent: 30.7,
      extraMetrics: {
        muscleMassKg: 29.5,
        bmi: 24.5,
        visceralFatLevel: 10,
      },
    });

    expect(normalized.muscleMassKg).toBe(29.5);
    expect(normalized.bmi).toBe(24.5);
    expect(normalized.visceralFatLevel).toBe(10);
    expect(normalized.extraMetrics).toBeUndefined();
  });
});

describe("bmaExtractionToMeasurement", () => {
  it("maps BMA fields to database columns", () => {
    const row = bmaExtractionToMeasurement("user-1", {
      summary: "InBody scan",
      recordedAt: "2026-05-27",
      weightKg: 66.7,
      bodyFatPercent: 30.7,
      bodyWaterKg: 20.4,
      proteinKg: 9.1,
      mineralKg: 3.15,
      muscleMassKg: 29.5,
      boneMassKg: 3.15,
      bmi: 24.5,
      visceralFatLevel: 10,
      metabolicAge: 25.5,
      skeletalMuscleMassKg: 29.5,
      bodyWaterPercent: 30.6,
    });

    expect(row.weightKg).toBe("66.7");
    expect(row.bodyWaterKg).toBe("20.4");
    expect(row.visceralFatLevel).toBe(10);
    expect(row.metabolicAge).toBe("25.5");
    expect(row.bodyWaterPercent).toBe("30.6");
  });
});
