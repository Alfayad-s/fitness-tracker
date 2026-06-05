import { describe, expect, it } from "vitest";

import {
  buildCompositionFillStack,
  getBodyCompositionFill,
  getPartCompositionFill,
} from "@/lib/measurements/body-composition-fill";

describe("buildCompositionFillStack", () => {
  it("tracks total and remaining body makeup", () => {
    const stack = buildCompositionFillStack({
      waterPercent: 51,
      fatPercent: 9.1,
      proteinPercent: 4.8,
      bonePercent: 3.6,
    });

    expect(stack.totalPercent).toBe(68.5);
    expect(stack.otherPercent).toBe(31.5);
  });
});

describe("getBodyCompositionFill", () => {
  const stack = buildCompositionFillStack({
    waterPercent: 51,
    fatPercent: 9.1,
    proteinPercent: 4.8,
    bonePercent: 3.6,
  });

  it("uses global scan percentages for the full-body blend", () => {
    const fill = getBodyCompositionFill(stack);

    expect(fill.layers).toEqual([
      { id: "bodyWater", label: "Body water", sharePercent: 51 },
      { id: "bodyFat", label: "Body fat", sharePercent: 9.1 },
      { id: "protein", label: "Protein", sharePercent: 4.8 },
      { id: "boneMass", label: "Bone mass", sharePercent: 3.6 },
    ]);
    expect(fill.dominantMetric).toBe("bodyWater");
    expect(fill.fillColor).not.toBe("#e4e4e7");
  });

  it("applies the same global blend to every body part", () => {
    const bodyFill = getBodyCompositionFill(stack);
    const thighFill = getPartCompositionFill("left_leg_upper", stack);
    const headFill = getPartCompositionFill("head", stack);

    expect(thighFill.fillColor).toBe(bodyFill.fillColor);
    expect(headFill.fillColor).toBe(bodyFill.fillColor);
    expect(thighFill.layers).toEqual(bodyFill.layers);
  });
});
