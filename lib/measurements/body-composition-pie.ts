import type { BodyMeasurement } from "@/types";

export type CompositionPieSliceId =
  | "bodyWater"
  | "bodyFat"
  | "boneMass"
  | "protein";

export type CompositionPieSlice = {
  id: CompositionPieSliceId;
  label: string;
  massKg: number;
  fill: string;
};

export type CompositionPieData = {
  slices: CompositionPieSlice[];
  recordedAtLabel: string | null;
  totalKg: number;
};

function parsePositive(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 10) / 10;
}

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Build pie slices for body water, fat (from % × weight), bone mass, and protein. */
export function buildBodyCompositionPieData(
  measurement: BodyMeasurement | null,
): CompositionPieData | null {
  if (!measurement) return null;

  const weightKg = parsePositive(measurement.weightKg);
  const bodyWaterKg = parsePositive(measurement.bodyWaterKg);
  const proteinKg = parsePositive(measurement.proteinKg);
  const boneMassKg = parsePositive(measurement.boneMassKg);

  let bodyFatKg: number | null = null;
  const bodyFatPercent = parsePositive(measurement.bodyFatPercent);
  if (bodyFatPercent != null && weightKg != null) {
    bodyFatKg = Math.round(((weightKg * bodyFatPercent) / 100) * 10) / 10;
  }

  const rawSlices: Array<{
    id: CompositionPieSliceId;
    label: string;
    massKg: number | null;
  }> = [
    { id: "bodyWater", label: "Body water", massKg: bodyWaterKg },
    { id: "bodyFat", label: "Body fat", massKg: bodyFatKg },
    { id: "boneMass", label: "Bone mass", massKg: boneMassKg },
    { id: "protein", label: "Protein", massKg: proteinKg },
  ];

  const slices: CompositionPieSlice[] = rawSlices
    .filter((slice): slice is typeof slice & { massKg: number } =>
      slice.massKg != null,
    )
    .map((slice) => ({
      id: slice.id,
      label: slice.label,
      massKg: slice.massKg,
      fill: `var(--color-${slice.id})`,
    }));

  if (slices.length === 0) return null;

  const totalKg =
    Math.round(slices.reduce((sum, slice) => sum + slice.massKg, 0) * 10) / 10;

  return {
    slices,
    recordedAtLabel: formatRecordedDate(measurement.recordedAt),
    totalKg,
  };
}
