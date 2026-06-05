import type { BodyPartId } from "@/lib/measurements/body-composition-body-map";
import type { CompositionFillLayerId } from "@/lib/measurements/body-composition-fill";
import { COMPOSITION_FILL_COLORS } from "@/lib/measurements/body-composition-fill";

export type PartMetricEstimate = {
  id: CompositionFillLayerId;
  label: string;
  massKg: number;
  percentOfBody: number | null;
  shareOfPart: number;
  color: string;
};

export type PartCompositionEstimate = {
  partId: BodyPartId;
  label: string;
  metrics: PartMetricEstimate[];
  estimatedPartMassKg: number;
};

type RegionalWeights = Record<BodyPartId, number>;

/** Relative regional tissue weights inspired by segmental body-composition models. */
const REGIONAL_WATER_WEIGHTS: RegionalWeights = {
  head: 8,
  chest: 10,
  stomach: 20,
  left_shoulder: 2.5,
  right_shoulder: 2.5,
  left_arm: 4.5,
  right_arm: 4.5,
  left_hand: 1,
  right_hand: 1,
  left_leg_upper: 9,
  right_leg_upper: 9,
  left_leg_lower: 6,
  right_leg_lower: 6,
  left_foot: 1.5,
  right_foot: 1.5,
};

const REGIONAL_FAT_WEIGHTS: RegionalWeights = {
  head: 2,
  chest: 6,
  stomach: 28,
  left_shoulder: 3,
  right_shoulder: 3,
  left_arm: 5,
  right_arm: 5,
  left_hand: 0.5,
  right_hand: 0.5,
  left_leg_upper: 12,
  right_leg_upper: 12,
  left_leg_lower: 8,
  right_leg_lower: 8,
  left_foot: 0.5,
  right_foot: 0.5,
};

const REGIONAL_PROTEIN_WEIGHTS: RegionalWeights = {
  head: 3,
  chest: 14,
  stomach: 8,
  left_shoulder: 5,
  right_shoulder: 5,
  left_arm: 10,
  right_arm: 10,
  left_hand: 1.5,
  right_hand: 1.5,
  left_leg_upper: 16,
  right_leg_upper: 16,
  left_leg_lower: 8,
  right_leg_lower: 8,
  left_foot: 0.5,
  right_foot: 0.5,
};

const REGIONAL_BONE_WEIGHTS: RegionalWeights = {
  head: 12,
  chest: 14,
  stomach: 6,
  left_shoulder: 3,
  right_shoulder: 3,
  left_arm: 6,
  right_arm: 6,
  left_hand: 2,
  right_hand: 2,
  left_leg_upper: 14,
  right_leg_upper: 14,
  left_leg_lower: 10,
  right_leg_lower: 10,
  left_foot: 3,
  right_foot: 3,
};

const METRIC_CONFIG: {
  id: CompositionFillLayerId;
  label: string;
  weights: RegionalWeights;
}[] = [
  { id: "bodyWater", label: "Body water", weights: REGIONAL_WATER_WEIGHTS },
  { id: "bodyFat", label: "Body fat", weights: REGIONAL_FAT_WEIGHTS },
  { id: "protein", label: "Protein", weights: REGIONAL_PROTEIN_WEIGHTS },
  { id: "boneMass", label: "Bone mass", weights: REGIONAL_BONE_WEIGHTS },
];

function sumWeights(weights: RegionalWeights): number {
  return Object.values(weights).reduce((sum, value) => sum + value, 0);
}

function roundKg(value: number): number {
  return Math.round(value * 10) / 10;
}

function distributeMass(
  totalMassKg: number | null,
  partId: BodyPartId,
  weights: RegionalWeights,
): number | null {
  if (totalMassKg == null || totalMassKg <= 0) return null;
  const totalWeight = sumWeights(weights);
  if (totalWeight <= 0) return null;
  return roundKg((totalMassKg * weights[partId]) / totalWeight);
}

function percentOfBody(
  massKg: number | null,
  weightKg: number | null,
): number | null {
  if (massKg == null || weightKg == null || weightKg <= 0) return null;
  return Math.round(((massKg / weightKg) * 100) * 10) / 10;
}

export function estimatePartComposition(input: {
  partId: BodyPartId;
  label: string;
  weightKg: number | null;
  bodyWaterKg: number | null;
  bodyFatKg: number | null;
  proteinKg: number | null;
  boneMassKg: number | null;
}): PartCompositionEstimate | null {
  const hasAnyMetric =
    input.bodyWaterKg != null ||
    input.bodyFatKg != null ||
    input.proteinKg != null ||
    input.boneMassKg != null;

  if (!hasAnyMetric) return null;

  const masses: Record<CompositionFillLayerId, number | null> = {
    bodyWater: distributeMass(
      input.bodyWaterKg,
      input.partId,
      REGIONAL_WATER_WEIGHTS,
    ),
    bodyFat: distributeMass(
      input.bodyFatKg,
      input.partId,
      REGIONAL_FAT_WEIGHTS,
    ),
    protein: distributeMass(
      input.proteinKg,
      input.partId,
      REGIONAL_PROTEIN_WEIGHTS,
    ),
    boneMass: distributeMass(
      input.boneMassKg,
      input.partId,
      REGIONAL_BONE_WEIGHTS,
    ),
  };

  const estimatedPartMassKg = roundKg(
    METRIC_CONFIG.reduce((sum, metric) => sum + (masses[metric.id] ?? 0), 0),
  );

  const metrics = METRIC_CONFIG.flatMap((metric) => {
    const massKg = masses[metric.id];
    if (massKg == null || massKg <= 0) return [];

    return [
      {
        id: metric.id,
        label: metric.label,
        massKg,
        percentOfBody: percentOfBody(massKg, input.weightKg),
        shareOfPart:
          estimatedPartMassKg > 0
            ? Math.round(((massKg / estimatedPartMassKg) * 100) * 10) / 10
            : 0,
        color: COMPOSITION_FILL_COLORS[metric.id],
      },
    ];
  });

  return {
    partId: input.partId,
    label: input.label,
    metrics,
    estimatedPartMassKg,
  };
}

export function buildAllPartCompositionEstimates(input: {
  weightKg: number | null;
  bodyWaterKg: number | null;
  bodyFatKg: number | null;
  proteinKg: number | null;
  boneMassKg: number | null;
  partLabels: Record<BodyPartId, string>;
}): Partial<Record<BodyPartId, PartCompositionEstimate>> {
  const estimates: Partial<Record<BodyPartId, PartCompositionEstimate>> = {};

  for (const partId of Object.keys(input.partLabels) as BodyPartId[]) {
    const estimate = estimatePartComposition({
      partId,
      label: input.partLabels[partId],
      weightKg: input.weightKg,
      bodyWaterKg: input.bodyWaterKg,
      bodyFatKg: input.bodyFatKg,
      proteinKg: input.proteinKg,
      boneMassKg: input.boneMassKg,
    });
    if (estimate) estimates[partId] = estimate;
  }

  return estimates;
}
