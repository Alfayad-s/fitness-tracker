import Link from "next/link";

import { NutritionProgressBars } from "@/components/nutrition/nutrition-progress-bars";
import { getDailyNutritionLog } from "@/lib/db/queries/nutrition";
import { buildNutritionProgress } from "@/lib/nutrition/daily-progress";
import type { DailyNutritionTargets } from "@/lib/measurements/daily-nutrition-targets";
import { todayDateString } from "@/lib/workout/format";

type DailyNutritionTodayProps = {
  userId: string;
  targets: DailyNutritionTargets;
};

export async function DailyNutritionToday({
  userId,
  targets,
}: DailyNutritionTodayProps) {
  const log = await getDailyNutritionLog(userId, todayDateString());
  const progress = buildNutritionProgress(log, targets);
  const hasLogs =
    log.meals.length > 0 || log.waterEntries.length > 0;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Today&apos;s tracking</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasLogs
              ? "Meals and water logged today"
              : "Nothing logged yet today"}
          </p>
        </div>
        <Link
          href="/nutrition"
          className="shrink-0 text-xs font-medium text-primary hover:underline"
        >
          Track →
        </Link>
      </div>
      <div className="mt-3">
        <NutritionProgressBars progress={progress} />
      </div>
    </section>
  );
}
