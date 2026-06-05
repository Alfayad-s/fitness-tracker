import Link from "next/link";

import {
  computeCompositionScore,
  scoreLabel,
  scoreTheme,
} from "@/lib/measurements/composition-score";
import { cn } from "@/lib/utils";
import type { BodyCompositionTrendPoint } from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

type CompositionScoreHeroProps = {
  latestMeasurement: BodyMeasurement | null;
  trendPoints: BodyCompositionTrendPoint[];
};

function resolveLatestScore(
  latestMeasurement: BodyMeasurement | null,
  trendPoints: BodyCompositionTrendPoint[],
): number | null {
  const fromTrend = trendPoints.filter((p) => p.score != null).at(-1)?.score;
  if (fromTrend != null) return fromTrend;
  if (latestMeasurement) return computeCompositionScore(latestMeasurement);
  return null;
}

export function CompositionScoreHero({
  latestMeasurement,
  trendPoints,
}: CompositionScoreHeroProps) {
  const score = resolveLatestScore(latestMeasurement, trendPoints);
  const scoreHistory = trendPoints
    .filter((p) => p.score != null)
    .map((p) => p.score!) as number[];
  const previousScore =
    scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 2] : null;
  const delta =
    score != null && previousScore != null ? score - previousScore : null;

  if (score == null) {
    return (
      <section className="rounded-xl bg-card p-4">
        <h2 className="text-sm font-semibold">Composition score</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Log body composition to unlock your score and daily targets.
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

  const theme = scoreTheme(score);

  return (
    <section
      className={cn(
        "rounded-xl p-4",
        theme.bg,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Composition score
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <span
              className={cn(
                "text-5xl font-bold tabular-nums leading-none tracking-tight",
                theme.text,
              )}
            >
              {score}
            </span>
            <span className="pb-1 text-lg font-medium text-muted-foreground">
              / 100
            </span>
            <span
              className={cn(
                "mb-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                theme.badge,
              )}
            >
              {scoreLabel(score)}
            </span>
          </div>
          {delta != null && delta !== 0 && (
            <p
              className={cn(
                "mt-2 text-sm font-medium tabular-nums",
                delta > 0 ? "text-emerald-600" : "text-orange-600",
              )}
            >
              {delta > 0 ? "↑" : "↓"} {Math.abs(delta)} vs last scan
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Indicative score from your BMA / body logs — not an official InBody
            score
          </p>
        </div>
      </div>
    </section>
  );
}
