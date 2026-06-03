"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { NutritionPhotoScan } from "@/components/nutrition/nutrition-scan-confirm";
import { MealList } from "@/components/nutrition/meal-list";
import { MealLogForm } from "@/components/nutrition/meal-log-form";
import {
  NutritionLogProvider,
  useNutritionLog,
} from "@/components/nutrition/nutrition-log-provider";
import { NutritionProgressBars } from "@/components/nutrition/nutrition-progress-bars";
import { WaterTracker } from "@/components/nutrition/water-tracker";
import { Input } from "@/components/ui/input";
import type { DailyNutritionLog } from "@/lib/db/queries/nutrition";
import type { DailyNutritionTargets } from "@/lib/measurements/daily-nutrition-targets";
import { todayDateString } from "@/lib/workout/format";

type NutritionTrackerProps = {
  initialLogDate: string;
  log: DailyNutritionLog;
  targets: DailyNutritionTargets;
};

function NutritionTrackerContent({ initialLogDate }: { initialLogDate: string }) {
  const router = useRouter();
  const { progress, targets, setLog } = useNutritionLog();
  const [logDate, setLogDate] = useState(initialLogDate);

  const onDateChange = useCallback(
    (next: string) => {
      setLogDate(next);
      router.push(`/nutrition?date=${next}`);
    },
    [router],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <label htmlFor="nutrition-date" className="text-sm font-medium">
          Day
        </label>
        <Input
          id="nutrition-date"
          type="date"
          value={logDate}
          max={todayDateString()}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Today vs targets</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Based on {targets.weightKg} kg · {targets.goalLabel} goal
        </p>
        <div className="mt-4">
          <NutritionProgressBars progress={progress} />
        </div>
      </section>

      <NutritionPhotoScan
        logDate={logDate}
        onSaved={(updated) => {
          setLog(updated);
        }}
      />

      <WaterTracker logDate={logDate} />
      <MealList />
      <MealLogForm logDate={logDate} />
    </div>
  );
}

export function NutritionTracker({
  initialLogDate,
  log,
  targets,
}: NutritionTrackerProps) {
  return (
    <NutritionLogProvider
      key={log.logDate}
      initialLog={log}
      targets={targets}
    >
      <NutritionTrackerContent initialLogDate={initialLogDate} />
    </NutritionLogProvider>
  );
}
