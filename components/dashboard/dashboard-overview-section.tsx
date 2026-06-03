import { StatSummary } from "@/components/analytics/stat-summary";
import { DbUnavailableAlert } from "@/components/db/db-unavailable-alert";
import { BodyCompositionSection } from "@/components/dashboard/body-composition-section";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { GoalProgressCard } from "@/components/dashboard/goal-progress-card";
import { loadDashboardOverview } from "@/lib/dashboard/get-dashboard-data";
import type { User } from "@supabase/supabase-js";

type DashboardOverviewSectionProps = {
  user: User;
};

export async function DashboardOverviewSection({
  user,
}: DashboardOverviewSectionProps) {
  const { summary, dbUnavailable } = await loadDashboardOverview(user);

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

      <StatSummary items={summary.stats} />

      <BodyCompositionSection user={user} />

      <DashboardQuickActions actions={summary.quickActions} />

      {summary.goal ? <GoalProgressCard goal={summary.goal} /> : null}
    </div>
  );
}
