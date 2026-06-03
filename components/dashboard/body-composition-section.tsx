import { Suspense } from "react";

import { BodyCompositionCard } from "@/components/dashboard/body-composition-card";
import { BodyCompositionScoreChart } from "@/components/dashboard/body-composition-score-chart";
import { CompositionScoreHero } from "@/components/dashboard/composition-score-hero";
import { DailyNutritionTargets } from "@/components/dashboard/daily-nutrition-targets";
import {
  CompositionFocusTips,
  CompositionFocusTipsSkeleton,
} from "@/components/dashboard/composition-focus-tips";
import { listBodyMeasurementsByUser } from "@/lib/db/queries/body-measurements";
import { buildBodyCompositionTrendPoints } from "@/lib/measurements/body-composition-trends";
import type { User } from "@supabase/supabase-js";

type BodyCompositionSectionProps = {
  user: User;
};

export async function BodyCompositionSection({
  user,
}: BodyCompositionSectionProps) {
  const { measurements } = await listBodyMeasurementsByUser(user.id, 24);
  const latest = measurements[0] ?? null;
  const trendPoints = buildBodyCompositionTrendPoints(measurements);

  return (
    <div className="flex flex-col gap-3">
      <CompositionScoreHero
        latestMeasurement={latest}
        trendPoints={trendPoints}
      />

      <DailyNutritionTargets user={user} latestMeasurement={latest} />

      <BodyCompositionCard measurement={latest} />

      {trendPoints.some((p) => p.score != null) && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Score trend
          </p>
          <BodyCompositionScoreChart data={trendPoints} />
        </section>
      )}

      <Suspense fallback={<CompositionFocusTipsSkeleton />}>
        <CompositionFocusTips user={user} />
      </Suspense>
    </div>
  );
}
