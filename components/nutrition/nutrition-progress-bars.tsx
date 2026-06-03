import { cn } from "@/lib/utils";
import type { NutritionProgress } from "@/lib/nutrition/daily-progress";

type NutritionProgressBarsProps = {
  progress: NutritionProgress;
  className?: string;
};

function ProgressRow({
  label,
  current,
  target,
  unit,
  percent,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {current.toLocaleString()}
          {unit} / {target.toLocaleString()}
          {unit}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percent >= 100 ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

export function NutritionProgressBars({
  progress,
  className,
}: NutritionProgressBarsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <ProgressRow
        label="Calories"
        current={progress.calories.current}
        target={progress.calories.target}
        unit=""
        percent={progress.calories.percent}
      />
      <ProgressRow
        label="Protein"
        current={progress.proteinG.current}
        target={progress.proteinG.target}
        unit="g"
        percent={progress.proteinG.percent}
      />
      <ProgressRow
        label="Water"
        current={progress.waterMl.current}
        target={progress.waterMl.target}
        unit=" ml"
        percent={progress.waterMl.percent}
      />
      <p className="text-xs text-muted-foreground">
        {progress.waterBottles.current} / {progress.waterBottles.target} bottles
        logged today
      </p>
    </div>
  );
}
