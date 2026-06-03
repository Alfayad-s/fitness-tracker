import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import {
  buildDashboardSummary,
  buildWeeklyFrequencyLastNWeeks,
} from "@/lib/analytics/dashboard-summary";
import { buildStreakPeriods } from "@/lib/analytics/streak-periods";
import { computeStreaks } from "@/lib/analytics/workout-stats";
import { fetchAllWorkoutDates } from "@/lib/db/queries/analytics";
import { getLatestBodyMeasurementByUser } from "@/lib/db/queries/body-measurements";
import { listWorkoutsByUser } from "@/lib/db/queries/workouts";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import type { DashboardSummary } from "@/types/dashboard";

export const getDashboardProfile = cache(async (authUser: User) =>
  getUserProfile(authUser),
);

export const getDashboardWorkoutDates = cache(async (userId: string) =>
  fetchAllWorkoutDates(userId),
);

export const getDashboardRecentWorkouts = cache(async (userId: string) =>
  listWorkoutsByUser(userId, { limit: 5 }),
);

export const getDashboardLatestMeasurement = cache(async (userId: string) =>
  getLatestBodyMeasurementByUser(userId),
);

export async function loadDashboardOverview(user: User): Promise<{
  summary: DashboardSummary;
  dbUnavailable: boolean;
}> {
  const [profile, allWorkoutDates, { workouts, dbUnavailable }, latestMeasurement] =
    await Promise.all([
      getDashboardProfile(user),
      getDashboardWorkoutDates(user.id),
      getDashboardRecentWorkouts(user.id),
      getDashboardLatestMeasurement(user.id),
    ]);

  return {
    dbUnavailable,
    summary: buildDashboardSummary({
      fullName: profile.fullName,
      username: profile.username,
      goalType: profile.goalType,
      recentWorkouts: workouts,
      allWorkoutDates,
      latestMeasurement,
    }),
  };
}

export async function loadDashboardWeeklyFrequency(userId: string) {
  const allWorkoutDates = await getDashboardWorkoutDates(userId);
  return buildWeeklyFrequencyLastNWeeks(allWorkoutDates, 4);
}

export async function loadDashboardRecentSection(userId: string) {
  const [allWorkoutDates, { workouts }] = await Promise.all([
    getDashboardWorkoutDates(userId),
    getDashboardRecentWorkouts(userId),
  ]);
  const uniqueWorkoutDates = [...new Set(allWorkoutDates)];
  const streak = computeStreaks(uniqueWorkoutDates);

  return {
    recentWorkouts: workouts,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalWorkouts: uniqueWorkoutDates.length,
    streakPeriods: buildStreakPeriods(uniqueWorkoutDates),
  };
}
