import { StatSummary } from "@/components/analytics/stat-summary";
import { DbUnavailableAlert } from "@/components/db/db-unavailable-alert";
import { BodyCompositionSection } from "@/components/dashboard/body-composition-section";
import { BodyCompositionVisual } from "@/components/dashboard/body-composition-visual";
import { SlideToStartWorkout } from "@/components/dashboard/slide-to-start-workout";
import { TodaysWorkoutCard } from "@/components/workout/todays-workout-card";
import { UpcomingWorkoutPlansCard } from "@/components/dashboard/upcoming-workout-plans-card";
import {
  ensureDailyWorkoutPlan,
  fetchUpcomingWorkoutPlans,
} from "@/services/daily-plan-actions";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { GoalProgressCard } from "@/components/dashboard/goal-progress-card";
import { loadDashboardOverview } from "@/lib/dashboard/get-dashboard-data";
import { buildBodyCompositionBodyData } from "@/lib/measurements/body-composition-body-map";
import { computeCompositionScore } from "@/lib/measurements/composition-score";
import type { User } from "@supabase/supabase-js";

type DashboardOverviewSectionProps = {
  user: User;
};

export async function DashboardOverviewSection({
  user,
}: DashboardOverviewSectionProps) {
  const { summary, latestMeasurement, heightCm, dbUnavailable } =
    await loadDashboardOverview(user);
  const [{ plan: dailyPlan }, schedule] = await Promise.all([
    ensureDailyWorkoutPlan(),
    fetchUpcomingWorkoutPlans(7),
  ]);
  const bodyVisualization = buildBodyCompositionBodyData(
    latestMeasurement,
    heightCm,
  );
  const compositionScore = latestMeasurement
    ? computeCompositionScore(latestMeasurement)
    : null;

  return (
    <div className="flex flex-col gap-6">
      {dbUnavailable ? <DbUnavailableAlert /> : null}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {summary.greeting}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s how your training is going.
        </p>
      </header>

      <BodyCompositionVisual
        data={bodyVisualization}
        hasCompositionData={bodyVisualization.metrics.length > 0}
        compositionScore={compositionScore}
        recordedAtLabel={bodyVisualization.recordedAtLabel}
      />

      <TodaysWorkoutCard plan={dailyPlan} compact />

      <UpcomingWorkoutPlansCard plans={[...schedule.upcomingPlans]} />

      <SlideToStartWorkout />

      <StatSummary items={summary.stats} />

      <BodyCompositionSection user={user} />

      <DashboardQuickActions actions={summary.quickActions} />

      {summary.goal ? <GoalProgressCard goal={summary.goal} /> : null}
    </div>
  );
}
