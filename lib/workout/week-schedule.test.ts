import { describe, expect, it } from "vitest";

import {
  getWeekDatesFromMondayStart,
  getWeekStartMonday,
  resolveWeekDayDisplay,
} from "@/lib/workout/week-schedule";

describe("week-schedule", () => {
  it("returns Monday for a Wednesday", () => {
    expect(getWeekStartMonday("2026-06-03")).toBe("2026-06-01");
  });

  it("returns Monday for a Sunday", () => {
    expect(getWeekStartMonday("2026-06-07")).toBe("2026-06-01");
  });

  it("builds seven consecutive dates from Monday", () => {
    expect(getWeekDatesFromMondayStart("2026-06-01")).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
    ]);
  });

  it("marks skipped plans as rest display", () => {
    const result = resolveWeekDayDisplay(
      {
        id: "1",
        planDate: "2026-06-03",
        templateId: null,
        title: "Leg day",
        status: "skipped",
        aiRationale: null,
        exercises: [],
      },
      null,
    );
    expect(result.displayStatus).toBe("skipped");
    expect(result.displayTitle).toBe("Rest day");
  });
});
