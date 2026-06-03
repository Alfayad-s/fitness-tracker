import { z } from "zod";

import { BMA_COMPOSITION_FIELDS } from "@/lib/measurements/bma-fields";

const optionalMetric = z
  .number()
  .finite()
  .positive()
  .optional()
  .nullable()
  .transform((v) => (v == null ? undefined : v));

const optionalNonNegative = z
  .number()
  .finite()
  .min(0)
  .optional()
  .nullable()
  .transform((v) => (v == null ? undefined : v));

const optionalPercent = z
  .number()
  .finite()
  .min(0)
  .max(100)
  .optional()
  .nullable()
  .transform((v) => (v == null ? undefined : v));

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .nullable()
  .transform((v) => (v == null ? undefined : v));

const bmaCompositionShape = {
  bodyWaterKg: optionalMetric,
  proteinKg: optionalMetric,
  mineralKg: optionalMetric,
  muscleMassKg: optionalMetric,
  boneMassKg: optionalMetric,
  bmi: optionalNonNegative,
  visceralFatLevel: z
    .number()
    .finite()
    .min(0)
    .max(60)
    .optional()
    .nullable()
    .transform((v) => (v == null ? undefined : v)),
  metabolicAge: optionalNonNegative,
  skeletalMuscleMassKg: optionalMetric,
  bodyWaterPercent: optionalPercent,
} as const;

export const bmaExtractionSchema = z.object({
  recordedAt: dateString,
  weightKg: optionalMetric,
  bodyFatPercent: optionalPercent,
  chestCm: optionalMetric,
  waistCm: optionalMetric,
  hipsCm: optionalMetric,
  bicepsCm: optionalMetric,
  thighsCm: optionalMetric,
  neckCm: optionalMetric,
  shouldersCm: optionalMetric,
  ...bmaCompositionShape,
  extraMetrics: z
    .record(z.string(), z.number().finite())
    .optional()
    .nullable()
    .transform((v) => (v == null ? undefined : v)),
  summary: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export type BmaExtraction = z.infer<typeof bmaExtractionSchema>;

/** Promote legacy extraMetrics keys into first-class BMA fields. */
export function normalizeBmaExtraction(extraction: BmaExtraction): BmaExtraction {
  const extra = { ...(extraction.extraMetrics ?? {}) };
  const normalized = { ...extraction };

  for (const key of BMA_COMPOSITION_FIELDS) {
    if (normalized[key] == null && extra[key] != null) {
      normalized[key] = extra[key] as BmaExtraction[typeof key];
      delete extra[key];
    }
  }

  normalized.extraMetrics =
    Object.keys(extra).length > 0 ? extra : undefined;

  return normalized;
}
