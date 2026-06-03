import type { DailyNutritionLog } from "@/lib/db/queries/nutrition";
import {
  WATER_BOTTLE_ML,
  type DailyNutritionTargets,
} from "@/lib/measurements/daily-nutrition-targets";

export type NutritionProgress = {
  calories: { current: number; target: number; percent: number };
  proteinG: { current: number; target: number; percent: number };
  waterMl: { current: number; target: number; percent: number };
  waterBottles: { current: number; target: number };
};

function percent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function buildNutritionProgress(
  log: DailyNutritionLog,
  targets: DailyNutritionTargets,
): NutritionProgress {
  const waterBottlesCurrent =
    Math.round((log.totals.waterMl / WATER_BOTTLE_ML) * 10) / 10;

  return {
    calories: {
      current: log.totals.calories,
      target: targets.caloriesKcal,
      percent: percent(log.totals.calories, targets.caloriesKcal),
    },
    proteinG: {
      current: log.totals.proteinG,
      target: targets.proteinGrams,
      percent: percent(log.totals.proteinG, targets.proteinGrams),
    },
    waterMl: {
      current: log.totals.waterMl,
      target: targets.waterMl,
      percent: percent(log.totals.waterMl, targets.waterMl),
    },
    waterBottles: {
      current: waterBottlesCurrent,
      target: targets.waterBottles,
    },
  };
}
