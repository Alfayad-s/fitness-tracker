import { Drumstick, Droplets, Flame } from "lucide-react";
import Link from "next/link";

import { DailyNutritionToday } from "@/components/nutrition/daily-nutrition-today";
import {
  calculateDailyNutritionTargets,
  WATER_BOTTLE_ML,
} from "@/lib/measurements/daily-nutrition-targets";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { cn } from "@/lib/utils";
import type { BodyMeasurement } from "@/types";
import type { User } from "@supabase/supabase-js";

type DailyNutritionTargetsProps = {
  user: User;
  latestMeasurement: BodyMeasurement | null;
};

export async function DailyNutritionTargets({
  user,
  latestMeasurement,
}: DailyNutritionTargetsProps) {
  const profile = await getUserProfile(user);
  const targets = calculateDailyNutritionTargets({
    profile,
    measurement: latestMeasurement,
  });

  if (!targets) {
    return (
      <section className="rounded-xl bg-card p-4">
        <h2 className="text-sm font-semibold">Daily targets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Log your weight (Progress or AI BMA scan) to see daily protein,
          calories, and water goals.
        </p>
        <Link
          href="/progress/measurements/new"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Log measurement →
        </Link>
      </section>
    );
  }

  const items = [
    {
      id: "protein",
      icon: Drumstick,
      label: "Protein / day",
      value: `${targets.proteinGrams}g`,
      detail: targets.proteinDetail,
      accent: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
    },
    {
      id: "calories",
      icon: Flame,
      label: "Calories / day",
      value: `${targets.caloriesKcal.toLocaleString()}`,
      detail: targets.calorieDetail,
      accent: "bg-orange-500/10 text-orange-700 dark:text-orange-500",
    },
    {
      id: "water",
      icon: Droplets,
      label: "Water / day",
      value:
        targets.waterBottles % 1 === 0
          ? `${targets.waterBottles} bottles`
          : `${targets.waterBottles} bottles`,
      subValue: `${targets.waterLiters} L`,
      detail: targets.waterDetail,
      accent: "bg-sky-500/10 text-sky-700 dark:text-sky-500",
    },
  ] as const;

  return (
    <section className="rounded-xl bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Daily targets</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            For {targets.weightKg} kg · {targets.goalLabel} goal
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <Link
            href="/nutrition"
            className="text-xs font-medium text-primary hover:underline"
          >
            Track meals & water
          </Link>
          <Link
            href="/profile"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Edit goal
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex flex-col rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    item.accent,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
              </div>
              <p className="mt-2 text-xl font-bold tabular-nums tracking-tight">
                {item.value}
              </p>
              {"subValue" in item && item.subValue && (
                <p className="text-sm font-medium tabular-nums text-muted-foreground">
                  {item.subValue}
                </p>
              )}
              {item.id === "water" && (
                <p className="text-xs text-muted-foreground">
                  ({WATER_BOTTLE_ML} ml each)
                </p>
              )}
              <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <DailyNutritionToday userId={user.id} targets={targets} />
      </div>
    </section>
  );
}
