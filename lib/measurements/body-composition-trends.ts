import { computeCompositionScore } from "@/lib/measurements/composition-score";
import type { BodyCompositionTrendPoint } from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function num(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Oldest → newest for charts. */
export function buildBodyCompositionTrendPoints(
  measurements: BodyMeasurement[],
): BodyCompositionTrendPoint[] {
  const sorted = [...measurements].sort(
    (a, b) =>
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  return sorted
    .map((m) => {
      const date = formatRecordedDate(m.recordedAt);
      const score = computeCompositionScore(m);

      return {
        date,
        score,
        weightKg: num(m.weightKg),
        bodyFatPercent: num(m.bodyFatPercent),
        proteinKg: num(m.proteinKg),
        boneMassKg: num(m.boneMassKg),
        bodyWaterKg: num(m.bodyWaterKg),
        bodyWaterPercent: num(m.bodyWaterPercent),
        muscleMassKg: num(m.muscleMassKg ?? m.skeletalMuscleMassKg),
      };
    })
    .filter(
      (p) =>
        p.score != null ||
        p.proteinKg != null ||
        p.bodyWaterKg != null ||
        p.boneMassKg != null ||
        p.muscleMassKg != null,
    );
}
