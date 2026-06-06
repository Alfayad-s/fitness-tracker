import {
  aggregateBodyTrendByWeek,
  isLongDateRange,
} from "@/lib/analytics/chart-aggregation";
import type { DateRange } from "@/lib/analytics/date-range";
import type { BodyAnalyticsSummary, BodyTrendPoint } from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildBodyAnalytics(
  measurements: BodyMeasurement[],
  range?: DateRange,
): BodyAnalyticsSummary {
  let points: BodyTrendPoint[] = measurements.map((m) => ({
    date: formatRecordedDate(m.recordedAt),
    weightKg: m.weightKg != null ? Number(m.weightKg) : null,
    bodyFatPercent:
      m.bodyFatPercent != null ? Number(m.bodyFatPercent) : null,
  }));

  if (range && isLongDateRange(range)) {
    points = aggregateBodyTrendByWeek(points);
  }

  return { points };
}
