import { describe, expect, it } from "vitest";

import {
  aggregateBodyTrendByWeek,
  aggregateExerciseProgressByWeek,
  getDateRangeDayCount,
  isLongDateRange,
} from "@/lib/analytics/chart-aggregation";
import type { DateRange } from "@/lib/analytics/date-range";

describe("chart aggregation", () => {
  it("counts inclusive day span", () => {
    const range: DateRange = { from: "2026-01-01", to: "2026-01-10", preset: "custom" };
    expect(getDateRangeDayCount(range)).toBe(10);
  });

  it("treats ranges over 90 days as long", () => {
    const range: DateRange = { from: "2026-01-01", to: "2026-04-05", preset: "custom" };
    expect(isLongDateRange(range)).toBe(true);
  });

  it("aggregates body trends to weekly latest values", () => {
    const points = aggregateBodyTrendByWeek([
      { date: "2026-01-05", weightKg: 80, bodyFatPercent: 20 },
      { date: "2026-01-07", weightKg: 79.5, bodyFatPercent: 19.8 },
      { date: "2026-01-12", weightKg: 79, bodyFatPercent: 19.5 },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({
      date: "2026-01-05",
      weightKg: 79.5,
      bodyFatPercent: 19.8,
    });
    expect(points[1]).toMatchObject({
      date: "2026-01-12",
      weightKg: 79,
    });
  });

  it("aggregates exercise progress to weekly maxes", () => {
    const points = aggregateExerciseProgressByWeek([
      {
        date: "2026-01-05",
        maxWeightKg: 100,
        estimated1RmKg: 110,
        bestSetVolume: 800,
      },
      {
        date: "2026-01-07",
        maxWeightKg: 105,
        estimated1RmKg: 115,
        bestSetVolume: 840,
      },
      {
        date: "2026-01-12",
        maxWeightKg: 102.5,
        estimated1RmKg: 112,
        bestSetVolume: 820,
      },
    ]);

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({
      date: "2026-01-05",
      maxWeightKg: 105,
      estimated1RmKg: 115,
      bestSetVolume: 840,
    });
  });
});
