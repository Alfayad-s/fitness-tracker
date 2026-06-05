import Link from "next/link";

import { WorkoutFrequencyChart } from "@/components/analytics/workout-frequency-chart";
import { loadDashboardWeeklyFrequency } from "@/lib/dashboard/get-dashboard-data";

type DashboardFrequencySectionProps = {
  userId: string;
};

export async function DashboardFrequencySection({
  userId,
}: DashboardFrequencySectionProps) {
  const weeklyFrequency = await loadDashboardWeeklyFrequency(userId);

  return (
    <section className="rounded-xl bg-card p-4">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Workouts per week</h2>
          <p className="text-sm text-muted-foreground">Last 4 weeks</p>
        </div>
        <Link
          href="/progress"
          className="text-sm font-medium text-primary hover:underline"
        >
          Progress
        </Link>
      </div>
      <WorkoutFrequencyChart data={weeklyFrequency} />
    </section>
  );
}
