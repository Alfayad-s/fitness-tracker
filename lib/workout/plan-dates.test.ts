import { describe, expect, it } from "vitest";

import {
  addDaysToDateString,
  formatPlanDateLabel,
  parsePlanDateHintFromText,
  resolveReferenceDate,
  tomorrowDateString,
} from "@/lib/workout/plan-dates";

describe("plan-dates", () => {
  const ref = "2026-06-03"; // Tuesday

  it("parses tomorrow", () => {
    expect(parsePlanDateHintFromText("plan tomorrow leg day", ref)).toBe(
      "2026-06-04",
    );
  });

  it("parses ISO date", () => {
    expect(parsePlanDateHintFromText("workout on 2026-06-10", ref)).toBe(
      "2026-06-10",
    );
  });

  it("parses next weekday", () => {
    expect(parsePlanDateHintFromText("plan next Friday workout", ref)).toBe(
      "2026-06-05",
    );
  });

  it("parses explicit day-month before tomorrow", () => {
    expect(
      parsePlanDateHintFromText("tomorrow is 8th jun is monday", ref),
    ).toBe("2026-06-08");
  });

  it("parses day after tomorrow", () => {
    expect(parsePlanDateHintFromText("day after tomorrow leg day", ref)).toBe(
      "2026-06-05",
    );
  });

  it("resolves client reference date", () => {
    expect(resolveReferenceDate("2026-06-07")).toBe("2026-06-07");
    expect(resolveReferenceDate("invalid", ref)).toBe(ref);
  });

  it("labels today and tomorrow", () => {
    expect(formatPlanDateLabel(ref, ref)).toBe("Today");
    expect(formatPlanDateLabel(tomorrowDateString(ref), ref)).toBe("Tomorrow");
  });

  it("adds days", () => {
    expect(addDaysToDateString(ref, 7)).toBe("2026-06-10");
  });
});
