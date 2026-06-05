import {
  ALL_BODY_PART_IDS,
  buildCompositionFillStack,
  getPartCompositionFill,
  type CompositionFillLayerId,
  type CompositionFillStack,
  type PartLayerShare,
} from "@/lib/measurements/body-composition-fill";
import {
  buildAllPartCompositionEstimates,
  type PartCompositionEstimate,
} from "@/lib/measurements/body-part-composition-estimate";
import { BMA_FIELD_LABELS } from "@/lib/measurements/bma-fields";
import type { CompositionPieSliceId } from "@/lib/measurements/body-composition-pie";
import type { BodyMeasurement } from "@/types";

export type BodyPartId =
  | "head"
  | "chest"
  | "stomach"
  | "left_shoulder"
  | "right_shoulder"
  | "left_arm"
  | "right_arm"
  | "left_hand"
  | "right_hand"
  | "left_leg_upper"
  | "right_leg_upper"
  | "left_leg_lower"
  | "right_leg_lower"
  | "left_foot"
  | "right_foot";

export type BodyPartMetricId = CompositionPieSliceId;

export type BodyPartInput = {
  selected: boolean;
  clickable: boolean;
  show: boolean;
  label: string;
  massKg: number | null;
  fillColor: string;
  layerShares: PartLayerShare[];
  dominantMetric: CompositionFillLayerId | null;
  metricId: BodyPartMetricId | "weight";
  color: string;
};

export type BodyCompositionMetric = {
  id: BodyPartMetricId;
  label: string;
  massKg: number;
  percent: number | null;
  color: string;
};

export type BodyCompositionExtraStat = {
  id: string;
  label: string;
  value: string;
  subValue?: string | null;
  accentColor?: string;
  className: string;
};

export type BodyCompositionBodyData = {
  heightCm: number | null;
  weightKg: number | null;
  bodyWaterPercent: number | null;
  bodyFatPercent: number | null;
  proteinPercent: number | null;
  bonePercent: number | null;
  extraStats: BodyCompositionExtraStat[];
  compositionStack: CompositionFillStack;
  recordedAtLabel: string | null;
  partsInput: Partial<Record<BodyPartId, BodyPartInput>>;
  partEstimates: Partial<Record<BodyPartId, PartCompositionEstimate>>;
  metrics: BodyCompositionMetric[];
};

export type { PartCompositionEstimate };

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const METRIC_COLORS: Record<BodyPartMetricId, string> = {
  bodyWater: "var(--chart-1)",
  bodyFat: "var(--chart-2)",
  boneMass: "var(--chart-3)",
  protein: "var(--chart-4)",
};

function parsePositive(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

function parseNonNegativeInt(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function formatPercentOfBody(
  massKg: number | null,
  weightKg: number | null,
): string | null {
  const percent = percentOfWeight(massKg, weightKg);
  return percent != null ? `${percent}% body` : null;
}

function buildExtraStats(
  measurement: BodyMeasurement | null,
  weightKg: number | null,
): BodyCompositionExtraStat[] {
  if (!measurement) return [];

  const stats: BodyCompositionExtraStat[] = [];

  const mineralKg = parsePositive(measurement.mineralKg);
  if (mineralKg != null) {
    stats.push({
      id: "mineralKg",
      label: BMA_FIELD_LABELS.mineralKg,
      value: `${mineralKg} kg`,
      subValue: formatPercentOfBody(mineralKg, weightKg),
      accentColor: "#64748b",
      className: "bg-slate-500/10 text-slate-900",
    });
  }

  const metabolicAge = parsePositive(measurement.metabolicAge);
  if (metabolicAge != null) {
    stats.push({
      id: "metabolicAge",
      label: BMA_FIELD_LABELS.metabolicAge,
      value: `${metabolicAge} yrs`,
      accentColor: "#f43f5e",
      className: "bg-rose-500/10 text-rose-900",
    });
  }

  const visceralFatLevel = parseNonNegativeInt(measurement.visceralFatLevel);
  if (visceralFatLevel != null) {
    stats.push({
      id: "visceralFatLevel",
      label: BMA_FIELD_LABELS.visceralFatLevel,
      value: String(visceralFatLevel),
      accentColor: "#ef4444",
      className: "bg-red-500/10 text-red-900",
    });
  }

  const skeletalMuscleMassKg = parsePositive(measurement.skeletalMuscleMassKg);
  if (skeletalMuscleMassKg != null) {
    stats.push({
      id: "skeletalMuscleMassKg",
      label: BMA_FIELD_LABELS.skeletalMuscleMassKg,
      value: `${skeletalMuscleMassKg} kg`,
      subValue: formatPercentOfBody(skeletalMuscleMassKg, weightKg),
      accentColor: "#6366f1",
      className: "bg-indigo-500/10 text-indigo-900",
    });
  }

  const bmi = parsePositive(measurement.bmi);
  if (bmi != null) {
    stats.push({
      id: "bmi",
      label: BMA_FIELD_LABELS.bmi,
      value: String(bmi),
      accentColor: "#a16207",
      className: "bg-amber-500/10 text-amber-950",
    });
  }

  return stats;
}

function percentOfWeight(
  massKg: number | null,
  weightKg: number | null,
): number | null {
  if (massKg == null || weightKg == null || weightKg <= 0) return null;
  return Math.min(100, Math.round(((massKg / weightKg) * 100) * 10) / 10);
}

function resolveBodyWaterPercent(
  measurement: BodyMeasurement | null,
  weightKg: number | null,
  bodyWaterKg: number | null,
): number | null {
  if (!measurement) return null;

  const fromScan = parsePositive(measurement.bodyWaterPercent);
  if (fromScan != null) return Math.min(100, fromScan);

  return percentOfWeight(bodyWaterKg, weightKg);
}

function resolveBodyFatPercent(
  measurement: BodyMeasurement | null,
  weightKg: number | null,
  bodyFatKg: number | null,
): number | null {
  if (!measurement) return null;

  const fromScan = parsePositive(measurement.bodyFatPercent);
  if (fromScan != null) return Math.min(100, fromScan);

  return percentOfWeight(bodyFatKg, weightKg);
}

function partInput(
  label: string,
  massKg: number | null,
  fillColor: string,
  layerShares: PartLayerShare[],
  dominantMetric: CompositionFillLayerId | null,
  metricId: BodyPartMetricId | "weight",
  color: string,
  active: boolean,
): BodyPartInput {
  return {
    selected: active,
    clickable: true,
    show: true,
    label,
    massKg,
    fillColor,
    layerShares,
    dominantMetric,
    metricId,
    color,
  };
}

/** Map BMA composition + profile height to human-body-react part highlights. */
export function buildBodyCompositionBodyData(
  measurement: BodyMeasurement | null,
  heightCm: string | number | null | undefined,
): BodyCompositionBodyData {
  const height = parsePositive(heightCm);
  const weightKg = measurement ? parsePositive(measurement.weightKg) : null;

  const bodyWaterKg = measurement
    ? parsePositive(measurement.bodyWaterKg)
    : null;
  const proteinKg = measurement ? parsePositive(measurement.proteinKg) : null;
  const boneMassKg = measurement ? parsePositive(measurement.boneMassKg) : null;

  let bodyFatKg: number | null = null;
  if (measurement) {
    const bodyFatPercent = parsePositive(measurement.bodyFatPercent);
    if (bodyFatPercent != null && weightKg != null) {
      bodyFatKg = Math.round(((weightKg * bodyFatPercent) / 100) * 10) / 10;
    }
  }

  const bodyWaterPercent = resolveBodyWaterPercent(
    measurement,
    weightKg,
    bodyWaterKg,
  );
  const bodyFatPercent = resolveBodyFatPercent(
    measurement,
    weightKg,
    bodyFatKg,
  );
  const proteinPercent = percentOfWeight(proteinKg, weightKg);
  const bonePercent = percentOfWeight(boneMassKg, weightKg);

  const compositionStack = buildCompositionFillStack({
    waterPercent: bodyWaterPercent,
    fatPercent: bodyFatPercent,
    proteinPercent,
    bonePercent,
  });

  const metrics: BodyCompositionMetric[] = [];
  if (bodyWaterKg != null) {
    metrics.push({
      id: "bodyWater",
      label: "Body water",
      massKg: bodyWaterKg,
      percent: bodyWaterPercent,
      color: METRIC_COLORS.bodyWater,
    });
  }
  if (bodyFatKg != null) {
    metrics.push({
      id: "bodyFat",
      label: "Body fat",
      massKg: bodyFatKg,
      percent: bodyFatPercent,
      color: METRIC_COLORS.bodyFat,
    });
  }
  if (boneMassKg != null) {
    metrics.push({
      id: "boneMass",
      label: "Bone mass",
      massKg: boneMassKg,
      percent: bonePercent,
      color: METRIC_COLORS.boneMass,
    });
  }
  if (proteinKg != null) {
    metrics.push({
      id: "protein",
      label: "Protein",
      massKg: proteinKg,
      percent: proteinPercent,
      color: METRIC_COLORS.protein,
    });
  }

  const massByMetric: Partial<Record<CompositionFillLayerId, number | null>> = {
    bodyWater: bodyWaterKg,
    bodyFat: bodyFatKg,
    protein: proteinKg,
    boneMass: boneMassKg,
  };

  const partLabels: Record<BodyPartId, string> = {
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
  };

  const partsInput: Partial<Record<BodyPartId, BodyPartInput>> = {};

  const bodyFill = getPartCompositionFill("chest", compositionStack);

  for (const partId of ALL_BODY_PART_IDS) {
    const dominantMass = bodyFill.dominantMetric
      ? (massByMetric[bodyFill.dominantMetric] ?? null)
      : null;

    partsInput[partId] = partInput(
      partLabels[partId],
      dominantMass,
      bodyFill.fillColor,
      bodyFill.layers,
      bodyFill.dominantMetric,
      bodyFill.dominantMetric ?? "weight",
      bodyFill.dominantMetric
        ? METRIC_COLORS[bodyFill.dominantMetric as BodyPartMetricId]
        : METRIC_COLORS.bodyWater,
      bodyFill.layers.length > 0,
    );
  }

  const partEstimates = buildAllPartCompositionEstimates({
    weightKg,
    bodyWaterKg,
    bodyFatKg,
    proteinKg,
    boneMassKg,
    partLabels,
  });

  return {
    heightCm: height,
    weightKg,
    bodyWaterPercent,
    bodyFatPercent,
    proteinPercent,
    bonePercent,
    extraStats: buildExtraStats(measurement, weightKg),
    compositionStack,
    recordedAtLabel: measurement
      ? formatRecordedDate(measurement.recordedAt)
      : null,
    partsInput,
    partEstimates,
    metrics,
  };
}

export function formatBodyPartLabel(partId: string): string {
  return partId.replaceAll("_", " ");
}
