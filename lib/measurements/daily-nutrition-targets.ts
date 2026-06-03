import type { UserProfile } from "@/lib/profile/get-user-profile";
import type { BodyMeasurement } from "@/types";
import type { GoalType } from "@/types";

/** Standard water bottle size for "bottles per day" display. */
export const WATER_BOTTLE_ML = 500;

export type DailyNutritionTargets = {
  proteinGrams: number;
  caloriesKcal: number;
  waterLiters: number;
  waterBottles: number;
  waterMl: number;
  weightKg: number;
  goalLabel: string;
  proteinDetail: string;
  calorieDetail: string;
  waterDetail: string;
};

type CalcInput = {
  profile: Pick<UserProfile, "gender" | "heightCm" | "goalType">;
  measurement: BodyMeasurement | null;
};

function num(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function goalLabel(goal: GoalType | null): string {
  switch (goal) {
    case "lose_weight":
      return "Fat loss";
    case "gain_muscle":
      return "Muscle gain";
    case "strength":
      return "Strength";
    case "endurance":
      return "Endurance";
    case "maintain":
      return "Maintain";
    case "general_fitness":
      return "General fitness";
    default:
      return "General fitness";
  }
}

/** Mifflin–St Jeor BMR; age defaulted when not on profile. */
function estimateBmr(
  weightKg: number,
  heightCm: number,
  gender: UserProfile["gender"],
  ageYears = 30,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78;
}

function proteinPerKg(goal: GoalType | null): number {
  switch (goal) {
    case "lose_weight":
      return 2;
    case "gain_muscle":
      return 2.2;
    case "strength":
      return 2.1;
    case "endurance":
      return 1.6;
    default:
      return 1.8;
  }
}

function calorieAdjustment(goal: GoalType | null): number {
  switch (goal) {
    case "lose_weight":
      return -400;
    case "gain_muscle":
      return 300;
    case "strength":
      return 200;
    case "endurance":
      return 150;
    default:
      return 0;
  }
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * Daily protein, calories, and hydration targets from weight, goal, and optional body fat.
 */
export function calculateDailyNutritionTargets(
  input: CalcInput,
): DailyNutritionTargets | null {
  const weightKg = num(input.measurement?.weightKg);
  if (weightKg == null) return null;

  const bodyFat = num(input.measurement?.bodyFatPercent);
  const heightCm = num(input.profile.heightCm);
  const goal = input.profile.goalType;

  const leanKg =
    bodyFat != null
      ? weightKg * (1 - bodyFat / 100)
      : weightKg * 0.85;

  const proteinGrams = roundTo(
    Math.max(leanKg * proteinPerKg(goal), weightKg * 1.4),
    5,
  );

  let maintenanceKcal: number;
  if (heightCm != null) {
    const bmr = estimateBmr(weightKg, heightCm, input.profile.gender);
    maintenanceKcal = bmr * 1.55;
  } else {
    maintenanceKcal = weightKg * 30;
  }

  const caloriesKcal = Math.max(
    1400,
    roundTo(maintenanceKcal + calorieAdjustment(goal), 50),
  );

  const waterMl = Math.round(weightKg * 35);
  const waterLiters = Math.round((waterMl / 1000) * 10) / 10;
  const waterBottles = Math.round((waterMl / WATER_BOTTLE_ML) * 2) / 2;

  const g = goalLabel(goal);

  return {
    proteinGrams,
    caloriesKcal,
    waterLiters,
    waterBottles,
    waterMl,
    weightKg,
    goalLabel: g,
    proteinDetail: bodyFat != null
      ? `~${proteinPerKg(goal)} g per kg lean mass`
      : `Based on ${weightKg} kg & ${g.toLowerCase()} goal`,
    calorieDetail: heightCm != null
      ? `Maintenance ~${roundTo(maintenanceKcal, 50)} kcal, adjusted for ${g.toLowerCase()}`
      : `Estimated for ${g.toLowerCase()} (add height in Profile for precision)`,
    waterDetail: `${waterMl} ml total · ${WATER_BOTTLE_ML} ml per bottle`,
  };
}
