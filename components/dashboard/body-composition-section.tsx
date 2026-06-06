import { Suspense } from "react";

import { DailyNutritionTargets } from "@/components/dashboard/daily-nutrition-targets";
import {
  CompositionFocusTips,
  CompositionFocusTipsSkeleton,
} from "@/components/dashboard/composition-focus-tips";
import { listBodyMeasurementsByUser } from "@/lib/db/queries/body-measurements";
import type { User } from "@supabase/supabase-js";

type BodyCompositionSectionProps = {
  user: User;
};

export async function BodyCompositionSection({
  user,
}: BodyCompositionSectionProps) {
  const { measurements } = await listBodyMeasurementsByUser(user.id, 24);
  const latest = measurements[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <DailyNutritionTargets user={user} latestMeasurement={latest} />

      <Suspense fallback={<CompositionFocusTipsSkeleton />}>
        <CompositionFocusTips user={user} />
      </Suspense>
    </div>
  );
}
