import {
  BMA_COMPOSITION_FIELDS,
  BMA_FIELD_LABELS,
  BMA_FIELD_UNITS,
  type BmaCompositionField,
} from "@/lib/measurements/bma-fields";
import type { BodyMeasurement } from "@/types";

export type BodyCompositionMetric = {
  id: string;
  label: string;
  value: string;
  /** Highlighted in the dashboard card (protein, bone, water). */
  featured?: boolean;
};

export type BodyCompositionDisplay = {
  recordedAtLabel: string | null;
  hasData: boolean;
  headline: BodyCompositionMetric[];
  composition: BodyCompositionMetric[];
};

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNumeric(
  raw: string | number | null | undefined,
  unit: "kg" | "%" | "" | "yrs",
): string | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (unit === "kg") return `${n} kg`;
  if (unit === "%") return `${n}%`;
  if (unit === "yrs") return `${n} yrs`;
  return String(n);
}

const FEATURED_FIELDS = new Set<BmaCompositionField>([
  "proteinKg",
  "boneMassKg",
  "bodyWaterKg",
  "bodyWaterPercent",
]);

export function buildBodyCompositionDisplay(
  measurement: BodyMeasurement | null,
): BodyCompositionDisplay {
  if (!measurement) {
    return {
      recordedAtLabel: null,
      hasData: false,
      headline: [],
      composition: [],
    };
  }

  const recordedAtLabel = formatRecordedDate(measurement.recordedAt);
  const headline: BodyCompositionMetric[] = [];

  const weight = formatNumeric(measurement.weightKg, "kg");
  if (weight) {
    headline.push({ id: "weight", label: "Weight", value: weight });
  }

  const bodyFat = formatNumeric(measurement.bodyFatPercent, "%");
  if (bodyFat) {
    headline.push({ id: "bodyFat", label: "Body fat", value: bodyFat });
  }

  const bmi = formatNumeric(measurement.bmi, "");
  if (bmi) {
    headline.push({ id: "bmi", label: "BMI", value: bmi });
  }

  const composition: BodyCompositionMetric[] = [];

  for (const field of BMA_COMPOSITION_FIELDS) {
    const raw = measurement[field];
    const formatted = formatNumeric(raw, BMA_FIELD_UNITS[field]);
    if (!formatted) continue;

    composition.push({
      id: field,
      label: BMA_FIELD_LABELS[field],
      value: formatted,
      featured: FEATURED_FIELDS.has(field),
    });
  }

  const hasData = headline.length > 0 || composition.length > 0;

  return {
    recordedAtLabel,
    hasData,
    headline,
    composition,
  };
}
