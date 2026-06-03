import type { StreakPeriod } from "@/lib/analytics/streak-periods";
import type { WeeklyFrequencyPoint } from "@/types/analytics";
import type { GoalType } from "@/types";
import type { WorkoutListItem } from "@/lib/db/queries/workouts";

export type DashboardQuickAction = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type DashboardGoal = {
  type: NonNullable<GoalType>;
  label: string;
};

export type DashboardSummary = {
  greeting: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  streakPeriods: StreakPeriod[];
  stats: { label: string; value: string }[];
  lastWorkout: WorkoutListItem | null;
  recentWorkouts: WorkoutListItem[];
  weeklyFrequency: WeeklyFrequencyPoint[];
  quickActions: DashboardQuickAction[];
  goal: DashboardGoal | null;
  latestBodyWeightKg: number | null;
  latestBodyWeightRecordedAt: string | null;
};
