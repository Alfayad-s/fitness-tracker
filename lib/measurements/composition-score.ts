import type { BodyMeasurement } from "@/types";

type ScoreInput = Pick<
  BodyMeasurement,
  | "weightKg"
  | "bodyFatPercent"
  | "bodyWaterPercent"
  | "proteinKg"
  | "muscleMassKg"
  | "skeletalMuscleMassKg"
  | "boneMassKg"
  | "bmi"
>;

function num(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function clamp(min: number, max: number, v: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Indicative 0–100 composition score from available BMA fields.
 * Not an official InBody score — useful for tracking your own trend.
 */
export function computeCompositionScore(
  measurement: ScoreInput,
): number | null {
  const weight = num(measurement.weightKg);
  if (weight == null || weight <= 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;

  const muscle = num(
    measurement.skeletalMuscleMassKg ?? measurement.muscleMassKg,
  );
  if (muscle != null && muscle > 0) {
    const musclePct = (muscle / weight) * 100;
    const muscleScore = clamp(0, 100, (musclePct / 42) * 100);
    weightedSum += muscleScore * 0.32;
    totalWeight += 0.32;
  }

  const bodyFat = num(measurement.bodyFatPercent);
  if (bodyFat != null && bodyFat > 0) {
    let fatScore: number;
    if (bodyFat <= 12) fatScore = 85;
    else if (bodyFat <= 22) fatScore = 100 - Math.abs(bodyFat - 16) * 2.5;
    else if (bodyFat <= 32) fatScore = 75 - (bodyFat - 22) * 4;
    else fatScore = clamp(25, 75, 35 - (bodyFat - 32) * 2);
    weightedSum += fatScore * 0.32;
    totalWeight += 0.32;
  }

  const waterPct = num(measurement.bodyWaterPercent);
  if (waterPct != null && waterPct > 0) {
    const waterScore = clamp(0, 100, 100 - Math.abs(waterPct - 58) * 3);
    weightedSum += waterScore * 0.18;
    totalWeight += 0.18;
  }

  const protein = num(measurement.proteinKg);
  if (protein != null && protein > 0) {
    const proteinPct = (protein / weight) * 100;
    const proteinScore = clamp(0, 100, (proteinPct / 16) * 100);
    weightedSum += proteinScore * 0.1;
    totalWeight += 0.1;
  }

  const bone = num(measurement.boneMassKg);
  if (bone != null && bone > 0) {
    const bonePct = (bone / weight) * 100;
    const boneScore = clamp(0, 100, (bonePct / 5) * 100);
    weightedSum += boneScore * 0.08;
    totalWeight += 0.08;
  }

  if (totalWeight === 0) return null;

  return Math.round(clamp(0, 100, weightedSum / totalWeight));
}

export function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Building";
}

export function scoreColorClass(score: number): string {
  return scoreTheme(score).text;
}

export type ScoreTheme = {
  text: string;
  bg: string;
  border: string;
  badge: string;
  chartStroke: string;
  chartFillTop: string;
  chartFillBottom: string;
};

export function scoreTheme(score: number): ScoreTheme {
  if (score >= 85) {
    return {
      text: "text-emerald-600",
      bg: "bg-emerald-500/12",
      border: "border-emerald-500/35",
      badge: "bg-emerald-600 text-white",
      chartStroke: "#059669",
      chartFillTop: "rgba(5, 150, 105, 0.35)",
      chartFillBottom: "rgba(5, 150, 105, 0.04)",
    };
  }
  if (score >= 70) {
    return {
      text: "text-blue-600",
      bg: "bg-blue-500/12",
      border: "border-blue-500/35",
      badge: "bg-blue-600 text-white",
      chartStroke: "#2563eb",
      chartFillTop: "rgba(37, 99, 235, 0.35)",
      chartFillBottom: "rgba(37, 99, 235, 0.04)",
    };
  }
  if (score >= 55) {
    return {
      text: "text-amber-600",
      bg: "bg-amber-500/12",
      border: "border-amber-500/35",
      badge: "bg-amber-600 text-white",
      chartStroke: "#d97706",
      chartFillTop: "rgba(217, 119, 6, 0.35)",
      chartFillBottom: "rgba(217, 119, 6, 0.04)",
    };
  }
  return {
    text: "text-orange-600",
    bg: "bg-orange-500/12",
    border: "border-orange-500/35",
    badge: "bg-orange-600 text-white",
    chartStroke: "#ea580c",
    chartFillTop: "rgba(234, 88, 12, 0.35)",
    chartFillBottom: "rgba(234, 88, 12, 0.04)",
  };
}
