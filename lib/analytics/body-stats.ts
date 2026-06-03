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
): BodyAnalyticsSummary {
  const points: BodyTrendPoint[] = measurements.map((m) => ({
    date: formatRecordedDate(m.recordedAt),
    weightKg: m.weightKg != null ? Number(m.weightKg) : null,
    bodyFatPercent:
      m.bodyFatPercent != null ? Number(m.bodyFatPercent) : null,
  }));

  return { points };
}
