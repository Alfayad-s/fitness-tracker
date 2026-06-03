import { describe, expect, it } from "vitest";

import {
  buildDashboardSummary,
  buildWeeklyFrequencyLastNWeeks,
  countWorkoutsThisWeek,
} from "@/lib/analytics/dashboard-summary";
import { weekKey } from "@/lib/analytics/date-range";

describe("dashboard-summary", () => {
  it("counts workouts in the current week", () => {
    const today = "2026-06-02";
    const thisWeek = weekKey(today);
    const lastWeekMonday = new Date(`${thisWeek}T12:00:00`);
    lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
    const lastWeek = weekKey(
      `${lastWeekMonday.getFullYear()}-${String(lastWeekMonday.getMonth() + 1).padStart(2, "0")}-${String(lastWeekMonday.getDate()).padStart(2, "0")}`,
    );

    expect(
      countWorkoutsThisWeek([today, today, lastWeek], new Date(`${today}T12:00:00`)),
    ).toBe(2);
  });

  it("builds four weekly frequency buckets", () => {
    const points = buildWeeklyFrequencyLastNWeeks(
      ["2026-05-01", "2026-05-02", "2026-06-01"],
      4,
    );
    expect(points).toHaveLength(4);
    expect(points.every((p) => typeof p.sessions === "number")).toBe(true);
  });

  it("builds greeting and stats from inputs", () => {
    const summary = buildDashboardSummary({
      fullName: "Alex",
      username: "alex_lifts",
      goalType: "strength",
      recentWorkouts: [],
      allWorkoutDates: [],
      latestMeasurement: null,
    });

    expect(summary.greeting).toContain("Alex");
    expect(summary.currentStreak).toBe(0);
    expect(summary.longestStreak).toBe(0);
    expect(summary.totalWorkouts).toBe(0);
    expect(summary.streakPeriods).toEqual([]);
    expect(summary.goal?.label).toBe("Build strength");
    expect(summary.quickActions).toHaveLength(2);
    expect(summary.stats).toHaveLength(4);
  });
});
