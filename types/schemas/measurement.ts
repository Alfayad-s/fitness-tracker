import { z } from "zod";

import { BMA_COMPOSITION_FIELDS } from "@/lib/measurements/bma-fields";

const optionalPositive = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "" || v === null) return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  });

const bmaCompositionShape = Object.fromEntries(
  BMA_COMPOSITION_FIELDS.map((key) => [key, optionalPositive]),
) as Record<(typeof BMA_COMPOSITION_FIELDS)[number], typeof optionalPositive>;

export const measurementFormSchema = z.object({
  recordedAt: z.string().min(1, "Date is required"),
  weightKg: optionalPositive,
  bodyFatPercent: optionalPositive,
  ...bmaCompositionShape,
  chestCm: optionalPositive,
  waistCm: optionalPositive,
  hipsCm: optionalPositive,
  bicepsCm: optionalPositive,
  thighsCm: optionalPositive,
  neckCm: optionalPositive,
  shouldersCm: optionalPositive,
});

export type MeasurementFormValues = z.infer<typeof measurementFormSchema>;

export const MEASUREMENT_FORM_SECTIONS = [
  {
    title: "Core",
    description: "Weight and body fat from scale or InBody.",
    fields: [
      { name: "weightKg" as const, label: "Weight (kg)", step: "0.1", placeholder: "66.7" },
      {
        name: "bodyFatPercent" as const,
        label: "Body fat %",
        step: "0.1",
        placeholder: "30.7",
        max: 100,
      },
      { name: "bmi" as const, label: "BMI", step: "0.1", placeholder: "24.5" },
    ],
  },
  {
    title: "Body composition",
    description: "Protein, minerals, water, muscle & bone (kg unless noted).",
    fields: [
      { name: "bodyWaterKg" as const, label: "Body water (kg)", step: "0.1", placeholder: "20.4" },
      {
        name: "bodyWaterPercent" as const,
        label: "Body water %",
        step: "0.1",
        placeholder: "30.6",
        max: 100,
      },
      { name: "proteinKg" as const, label: "Protein (kg)", step: "0.1", placeholder: "9.1" },
      { name: "mineralKg" as const, label: "Minerals (kg)", step: "0.1", placeholder: "3.15" },
      { name: "muscleMassKg" as const, label: "Muscle mass (kg)", step: "0.1", placeholder: "29.5" },
      {
        name: "skeletalMuscleMassKg" as const,
        label: "Skeletal muscle (kg)",
        step: "0.1",
        placeholder: "29.5",
      },
      { name: "boneMassKg" as const, label: "Bone mass (kg)", step: "0.1", placeholder: "3.15" },
      {
        name: "visceralFatLevel" as const,
        label: "Visceral fat level",
        step: "1",
        placeholder: "10",
      },
      {
        name: "metabolicAge" as const,
        label: "Metabolic age (yrs)",
        step: "0.1",
        placeholder: "25.5",
      },
    ],
  },
  {
    title: "Circumferences",
    description: "Optional tape measurements in cm.",
    fields: [
      { name: "chestCm" as const, label: "Chest" },
      { name: "waistCm" as const, label: "Waist" },
      { name: "hipsCm" as const, label: "Hips" },
      { name: "bicepsCm" as const, label: "Biceps" },
      { name: "thighsCm" as const, label: "Thighs" },
      { name: "neckCm" as const, label: "Neck" },
      { name: "shouldersCm" as const, label: "Shoulders" },
    ],
  },
] as const;
