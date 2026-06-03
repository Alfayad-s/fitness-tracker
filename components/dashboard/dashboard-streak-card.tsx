"use client";

import { useRouter } from "next/navigation";

import { StreakCard } from "@/components/ui/streak-card";
import type { StreakPeriod } from "@/components/ui/streak-calendar";

type DashboardStreakCardProps = {
  streak: StreakPeriod[];
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
};

export function DashboardStreakCard({
  streak,
  currentStreak,
  longestStreak,
  totalWorkouts,
}: DashboardStreakCardProps) {
  const router = useRouter();

  return (
    <StreakCard
      streak={streak}
      currentStreak={currentStreak}
      longestStreak={longestStreak}
      total={totalWorkouts}
      actionLabel="View progress"
      onActionClick={() => router.push("/progress")}
    />
  );
}
