import Link from "next/link";

import { DashboardRecentWorkouts } from "@/components/dashboard/dashboard-recent-workouts";
import { DashboardStreakCard } from "@/components/dashboard/dashboard-streak-card";
import { loadDashboardRecentSection } from "@/lib/dashboard/get-dashboard-data";

type DashboardRecentSectionProps = {
  userId: string;
};

export async function DashboardRecentSection({
  userId,
}: DashboardRecentSectionProps) {
  const {
    recentWorkouts,
    currentStreak,
    longestStreak,
    totalWorkouts,
    streakPeriods,
  } = await loadDashboardRecentSection(userId);

  return (
    <section className="flex flex-col gap-4">
      <DashboardStreakCard
        streak={streakPeriods}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        totalWorkouts={totalWorkouts}
      />
      <div className="flex items-end justify-between gap-2">
        <h2 className="text-base font-semibold">Recent workouts</h2>
        <Link
          href="/workouts"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <DashboardRecentWorkouts workouts={recentWorkouts} />
    </section>
  );
}
