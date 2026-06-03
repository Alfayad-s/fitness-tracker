/** First-class BMA / InBody columns on `body_measurements`. */
export const BMA_COMPOSITION_FIELDS = [
  "bodyWaterKg",
  "proteinKg",
  "mineralKg",
  "muscleMassKg",
  "boneMassKg",
  "bmi",
  "visceralFatLevel",
  "metabolicAge",
  "skeletalMuscleMassKg",
  "bodyWaterPercent",
] as const;

export type BmaCompositionField = (typeof BMA_COMPOSITION_FIELDS)[number];

export const BMA_FIELD_LABELS: Record<BmaCompositionField, string> = {
  bodyWaterKg: "Body water",
  proteinKg: "Protein",
  mineralKg: "Minerals",
  muscleMassKg: "Muscle mass",
  boneMassKg: "Bone mass",
  bmi: "BMI",
  visceralFatLevel: "Visceral fat level",
  metabolicAge: "Metabolic age",
  skeletalMuscleMassKg: "Skeletal muscle mass",
  bodyWaterPercent: "Body water %",
};

export const BMA_FIELD_UNITS: Record<
  BmaCompositionField,
  "kg" | "%" | "" | "yrs"
> = {
  bodyWaterKg: "kg",
  proteinKg: "kg",
  mineralKg: "kg",
  muscleMassKg: "kg",
  boneMassKg: "kg",
  bmi: "",
  visceralFatLevel: "",
  metabolicAge: "yrs",
  skeletalMuscleMassKg: "kg",
  bodyWaterPercent: "%",
};

export function formatBmaFieldValue(
  field: BmaCompositionField,
  value: string | number,
): string {
  const unit = BMA_FIELD_UNITS[field];
  const label = BMA_FIELD_LABELS[field];
  if (unit === "kg") return `${label}: ${value} kg`;
  if (unit === "%") return `${label}: ${value}%`;
  if (unit === "yrs") return `${label}: ${value}`;
  return `${label}: ${value}`;
}
