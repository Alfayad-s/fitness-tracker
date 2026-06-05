import type { BodyPartId } from "@/lib/measurements/body-composition-body-map";

export type CompositionFillLayerId =
  | "bodyWater"
  | "bodyFat"
  | "protein"
  | "boneMass";

export type CompositionFillLayer = {
  id: CompositionFillLayerId;
  label: string;
  percent: number;
  color: string;
};

export type CompositionFillStack = {
  layers: CompositionFillLayer[];
  totalPercent: number;
  otherPercent: number;
};

export type PartLayerShare = {
  id: CompositionFillLayerId;
  label: string;
  sharePercent: number;
};

export type PartCompositionFill = {
  fillColor: string;
  layers: PartLayerShare[];
  dominantMetric: CompositionFillLayerId | null;
};

export const COMPOSITION_FILL_COLORS: Record<CompositionFillLayerId, string> = {
  bodyWater: "#38bdf8",
  bodyFat: "#f97316",
  protein: "#a855f7",
  boneMass: "#22c55e",
};

export const BODY_BASE_FILL_HEX = "#e4e4e7";

export const ALL_BODY_PART_IDS: BodyPartId[] = [
  "head",
  "chest",
  "stomach",
  "left_shoulder",
  "right_shoulder",
  "left_arm",
  "right_arm",
  "left_hand",
  "right_hand",
  "left_leg_upper",
  "right_leg_upper",
  "left_leg_lower",
  "right_leg_lower",
  "left_foot",
  "right_foot",
];

function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function toHexColor(r: number, g: number, b: number): string {
  const clamp = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function blendColors(
  components: { color: string; weight: number }[],
): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let totalWeight = 0;

  for (const component of components) {
    if (component.weight <= 0) continue;
    const [cr, cg, cb] = parseHexColor(component.color);
    r += cr * component.weight;
    g += cg * component.weight;
    b += cb * component.weight;
    totalWeight += component.weight;
  }

  if (totalWeight <= 0) return BODY_BASE_FILL_HEX;
  return toHexColor(r / totalWeight, g / totalWeight, b / totalWeight);
}

export function buildCompositionFillStack(input: {
  waterPercent: number | null;
  fatPercent: number | null;
  proteinPercent: number | null;
  bonePercent: number | null;
}): CompositionFillStack {
  const candidates: CompositionFillLayer[] = [];

  if (input.waterPercent != null && input.waterPercent > 0) {
    candidates.push({
      id: "bodyWater",
      label: "Body water",
      percent: input.waterPercent,
      color: COMPOSITION_FILL_COLORS.bodyWater,
    });
  }
  if (input.fatPercent != null && input.fatPercent > 0) {
    candidates.push({
      id: "bodyFat",
      label: "Body fat",
      percent: input.fatPercent,
      color: COMPOSITION_FILL_COLORS.bodyFat,
    });
  }
  if (input.proteinPercent != null && input.proteinPercent > 0) {
    candidates.push({
      id: "protein",
      label: "Protein",
      percent: input.proteinPercent,
      color: COMPOSITION_FILL_COLORS.protein,
    });
  }
  if (input.bonePercent != null && input.bonePercent > 0) {
    candidates.push({
      id: "boneMass",
      label: "Bone mass",
      percent: input.bonePercent,
      color: COMPOSITION_FILL_COLORS.boneMass,
    });
  }

  const totalPercent = candidates.reduce((sum, layer) => sum + layer.percent, 0);
  const roundedTotal = Math.min(100, Math.round(totalPercent * 10) / 10);

  return {
    layers: candidates,
    totalPercent: roundedTotal,
    otherPercent: Math.max(0, Math.round((100 - roundedTotal) * 10) / 10),
  };
}

/** Blend the full-body color from global scan percentages. */
export function getBodyCompositionFill(
  stack: CompositionFillStack,
): PartCompositionFill {
  if (stack.layers.length === 0) {
    return { fillColor: BODY_BASE_FILL_HEX, layers: [], dominantMetric: null };
  }

  const components = [
    ...stack.layers.map((layer) => ({
      color: layer.color,
      weight: layer.percent / 100,
    })),
    {
      color: BODY_BASE_FILL_HEX,
      weight: stack.otherPercent / 100,
    },
  ];

  const layers = stack.layers.map((layer) => ({
    id: layer.id,
    label: layer.label,
    sharePercent: layer.percent,
  }));

  const dominantMetric = [...stack.layers].sort(
    (a, b) => b.percent - a.percent,
  )[0]?.id ?? null;

  return {
    fillColor: blendColors(components),
    layers,
    dominantMetric,
  };
}

/** Every body part uses the same global composition blend. */
export function getPartCompositionFill(
  _partId: BodyPartId,
  stack: CompositionFillStack,
): PartCompositionFill {
  return getBodyCompositionFill(stack);
}

export function buildBodyCompositionFillCss(
  stack: CompositionFillStack,
): string {
  if (stack.layers.length === 0) return "";

  const { fillColor } = getBodyCompositionFill(stack);

  return ALL_BODY_PART_IDS.flatMap((partId) => [
    `.body-composition-human[data-composition] path#${partId}`,
    `.body-composition-human[data-composition] #${partId}`,
  ])
    .map((selector) => `${selector} { fill: ${fillColor} !important; }`)
    .join("\n");
}
