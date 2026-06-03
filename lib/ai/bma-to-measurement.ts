import type { BodyMeasurementMap } from "@/lib/db/schema";
import {
  BMA_COMPOSITION_FIELDS,
  formatBmaFieldValue,
  type BmaCompositionField,
} from "@/lib/measurements/bma-fields";
import type { NewBodyMeasurement } from "@/types";
import {
  normalizeBmaExtraction,
  type BmaExtraction,
} from "@/types/schemas/bma-report";
import { todayDateString } from "@/lib/workout/format";

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

export function bmaExtractionHasMetrics(extraction: BmaExtraction): boolean {
  const normalized = normalizeBmaExtraction(extraction);

  if (normalized.weightKg != null || normalized.bodyFatPercent != null) {
    return true;
  }
  if (CIRCUMFERENCE_KEYS.some((k) => normalized[k] != null)) return true;
  if (BMA_COMPOSITION_FIELDS.some((k) => normalized[k] != null)) return true;
  if (
    normalized.extraMetrics &&
    Object.keys(normalized.extraMetrics).length > 0
  ) {
    return true;
  }
  return false;
}

export function bmaExtractionToMeasurement(
  userId: string,
  extraction: BmaExtraction,
): NewBodyMeasurement {
  const data = normalizeBmaExtraction(extraction);
  const measurements: BodyMeasurementMap = {};

  for (const key of CIRCUMFERENCE_KEYS) {
    const value = data[key];
    if (value != null) {
      measurements[key] = value;
    }
  }

  if (data.extraMetrics) {
    for (const [key, value] of Object.entries(data.extraMetrics)) {
      if (Number.isFinite(value)) {
        measurements[key] = value;
      }
    }
  }

  const dateStr = data.recordedAt ?? todayDateString();

  return {
    userId,
    recordedAt: new Date(`${dateStr}T12:00:00.000Z`),
    weightKg: data.weightKg != null ? numericString(data.weightKg) : null,
    bodyFatPercent:
      data.bodyFatPercent != null
        ? numericString(data.bodyFatPercent)
        : null,
    bodyWaterKg:
      data.bodyWaterKg != null ? numericString(data.bodyWaterKg) : null,
    proteinKg: data.proteinKg != null ? numericString(data.proteinKg) : null,
    mineralKg: data.mineralKg != null ? numericString(data.mineralKg) : null,
    muscleMassKg:
      data.muscleMassKg != null ? numericString(data.muscleMassKg) : null,
    boneMassKg:
      data.boneMassKg != null ? numericString(data.boneMassKg) : null,
    bmi: data.bmi != null ? numericString(data.bmi) : null,
    visceralFatLevel:
      data.visceralFatLevel != null
        ? Math.round(data.visceralFatLevel)
        : null,
    metabolicAge:
      data.metabolicAge != null ? numericString(data.metabolicAge, 1) : null,
    skeletalMuscleMassKg:
      data.skeletalMuscleMassKg != null
        ? numericString(data.skeletalMuscleMassKg)
        : null,
    bodyWaterPercent:
      data.bodyWaterPercent != null
        ? numericString(data.bodyWaterPercent)
        : null,
    measurements: Object.keys(measurements).length > 0 ? measurements : null,
  };
}

function formatMetricsList(extraction: BmaExtraction): string[] {
  const data = normalizeBmaExtraction(extraction);
  const lines: string[] = [];

  if (data.recordedAt) {
    lines.push(`- Date: ${data.recordedAt}`);
  }
  if (data.weightKg != null) {
    lines.push(`- Weight: ${data.weightKg} kg`);
  }
  if (data.bodyFatPercent != null) {
    lines.push(`- Body fat: ${data.bodyFatPercent}%`);
  }

  for (const key of BMA_COMPOSITION_FIELDS) {
    const value = data[key];
    if (value != null) {
      lines.push(`- ${formatBmaFieldValue(key, value)}`);
    }
  }

  for (const key of CIRCUMFERENCE_KEYS) {
    const v = data[key];
    if (v != null) {
      const label = key.replace(/Cm$/, "");
      lines.push(`- ${label}: ${v} cm`);
    }
  }

  if (data.extraMetrics) {
    for (const [key, value] of Object.entries(data.extraMetrics)) {
      lines.push(`- ${key}: ${value}`);
    }
  }

  return lines;
}

/** Assistant message before the user taps Save. */
export function formatBmaPreviewMessage(extraction: BmaExtraction): string {
  const lines: string[] = [
    extraction.summary,
    "",
    "Here’s what I read from your report:",
    ...formatMetricsList(extraction),
  ];

  if (extraction.confidence && extraction.confidence !== "high") {
    lines.push(
      "",
      `Note: extraction confidence is ${extraction.confidence}. Review before saving.`,
    );
  }

  lines.push(
    "",
    "Tap Save details below to add these to your Progress profile.",
  );

  return lines.join("\n");
}

export function formatSavedMetricsMessage(extraction: BmaExtraction): string {
  const lines: string[] = [
    extraction.summary,
    "",
    "✅ Saved to your Progress measurements",
    ...formatMetricsList(extraction),
  ];

  if (extraction.confidence && extraction.confidence !== "high") {
    lines.push(
      "",
      `Note: extraction confidence was ${extraction.confidence}. Review on Progress and edit if needed.`,
    );
  }

  lines.push("", "View and edit on the Progress tab.");

  return lines.join("\n");
}

/** Display lines for a stored body_measurements row. */
export function formatStoredMeasurementLines(
  row: Pick<
    NewBodyMeasurement,
    | "weightKg"
    | "bodyFatPercent"
    | "bodyWaterKg"
    | "proteinKg"
    | "mineralKg"
    | "muscleMassKg"
    | "boneMassKg"
    | "bmi"
    | "visceralFatLevel"
    | "metabolicAge"
    | "skeletalMuscleMassKg"
    | "bodyWaterPercent"
    | "measurements"
  >,
): string[] {
  const lines: string[] = [];

  if (row.weightKg != null) lines.push(`${row.weightKg} kg`);
  if (row.bodyFatPercent != null) lines.push(`${row.bodyFatPercent}% body fat`);

  for (const key of BMA_COMPOSITION_FIELDS) {
    const raw = row[key as BmaCompositionField];
    if (raw != null && raw !== "") {
      lines.push(formatBmaFieldValue(key, Number(raw)));
    }
  }

  if (row.measurements) {
    for (const [k, v] of Object.entries(row.measurements)) {
      if (v != null) {
        lines.push(`${k.replace(/Cm$/, "")}: ${v} cm`);
      }
    }
  }

  return lines;
}
