import type { BodyMeasurementMap } from "@/lib/db/schema";
import { BMA_COMPOSITION_FIELDS } from "@/lib/measurements/bma-fields";
import type { NewBodyMeasurement } from "@/types";
import type { MeasurementFormValues } from "@/types/schemas/measurement";

const CIRCUMFERENCE_KEYS = [
  "chestCm",
  "waistCm",
  "hipsCm",
  "bicepsCm",
  "thighsCm",
  "neckCm",
  "shouldersCm",
] as const;

function numericString(value: number, decimals = 2): string {
  return Number(value.toFixed(decimals)).toString();
}

function toMeasurementsMap(values: MeasurementFormValues): BodyMeasurementMap | null {
  const map: BodyMeasurementMap = {};
  for (const key of CIRCUMFERENCE_KEYS) {
    const value = values[key];
    if (value != null) map[key] = value;
  }
  return Object.keys(map).length > 0 ? map : null;
}

export function measurementFormHasMetrics(
  values: MeasurementFormValues,
): boolean {
  if (values.weightKg != null || values.bodyFatPercent != null) return true;
  if (CIRCUMFERENCE_KEYS.some((k) => values[k] != null)) return true;
  if (BMA_COMPOSITION_FIELDS.some((k) => values[k] != null)) return true;
  return false;
}

export function measurementFormToInsert(
  userId: string,
  values: MeasurementFormValues,
): NewBodyMeasurement {
  return {
    userId,
    recordedAt: new Date(`${values.recordedAt}T12:00:00.000Z`),
    weightKg: values.weightKg != null ? numericString(values.weightKg) : null,
    bodyFatPercent:
      values.bodyFatPercent != null
        ? numericString(values.bodyFatPercent)
        : null,
    bodyWaterKg:
      values.bodyWaterKg != null ? numericString(values.bodyWaterKg) : null,
    proteinKg:
      values.proteinKg != null ? numericString(values.proteinKg) : null,
    mineralKg:
      values.mineralKg != null ? numericString(values.mineralKg) : null,
    muscleMassKg:
      values.muscleMassKg != null ? numericString(values.muscleMassKg) : null,
    boneMassKg:
      values.boneMassKg != null ? numericString(values.boneMassKg) : null,
    bmi: values.bmi != null ? numericString(values.bmi) : null,
    visceralFatLevel:
      values.visceralFatLevel != null
        ? Math.round(values.visceralFatLevel)
        : null,
    metabolicAge:
      values.metabolicAge != null
        ? numericString(values.metabolicAge, 1)
        : null,
    skeletalMuscleMassKg:
      values.skeletalMuscleMassKg != null
        ? numericString(values.skeletalMuscleMassKg)
        : null,
    bodyWaterPercent:
      values.bodyWaterPercent != null
        ? numericString(values.bodyWaterPercent)
        : null,
    measurements: toMeasurementsMap(values),
  };
}
