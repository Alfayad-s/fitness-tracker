import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import {
  buildDashboardSummary,
  buildWeeklyFrequencyLastNWeeks,
  lastNWeekKeys,
} from "@/lib/analytics/dashboard-summary";
import { buildStreakPeriods } from "@/lib/analytics/streak-periods";
import { computeStreaks } from "@/lib/analytics/workout-stats";
import {
  fetchRecentWorkoutDatesForStreak,
  fetchWorkoutDatesInRange,
  fetchWorkoutSessionCount,
} from "@/lib/db/queries/analytics";
import { getLatestBodyMeasurementByUser } from "@/lib/db/queries/body-measurements";
import { listWorkoutsByUser } from "@/lib/db/queries/workouts";
import { getUserProfile, type UserProfile } from "@/lib/profile/get-user-profile";
import type { DashboardSummary } from "@/types/dashboard";

const DASHBOARD_WEEK_COUNT = 4;

function dashboardWeeklyDateRange(anchor = new Date()) {
  const weeks = lastNWeekKeys(DASHBOARD_WEEK_COUNT, anchor);
  const from = weeks[0]!;
  const y = anchor.getFullYear();
  const m = String(anchor.getMonth() + 1).padStart(2, "0");
  const d = String(anchor.getDate()).padStart(2, "0");
  return { from, to: `${y}-${m}-${d}` };
}

export const getDashboardProfile = cache(async (authUser: User) =>
  getUserProfile(authUser),
);

export const getDashboardStreakDates = cache(async (userId: string) =>
  fetchRecentWorkoutDatesForStreak(userId),
);

export const getDashboardWeeklyWorkoutDates = cache(async (userId: string) => {
  const range = dashboardWeeklyDateRange();
  return fetchWorkoutDatesInRange(userId, {
    from: range.from,
    to: range.to,
    preset: "custom",
  });
});

export const getDashboardWorkoutCount = cache(async (userId: string) =>
  fetchWorkoutSessionCount(userId),
);

export const getDashboardRecentWorkouts = cache(async (userId: string) =>
  listWorkoutsByUser(userId, { limit: 5 }),
);

export const getDashboardLatestMeasurement = cache(async (userId: string) =>
  getLatestBodyMeasurementByUser(userId),
);

export async function loadDashboardOverview(user: User): Promise<{
  profile: UserProfile;
  summary: DashboardSummary;
  latestMeasurement: Awaited<ReturnType<typeof getDashboardLatestMeasurement>>;
  dbUnavailable: boolean;
}> {
  const [
    profile,
    streakWorkoutDates,
    weeklyWorkoutDates,
    totalWorkoutCount,
    { workouts, dbUnavailable },
    latestMeasurement,
  ] = await Promise.all([
    getDashboardProfile(user),
    getDashboardStreakDates(user.id),
    getDashboardWeeklyWorkoutDates(user.id),
    getDashboardWorkoutCount(user.id),
    getDashboardRecentWorkouts(user.id),
    getDashboardLatestMeasurement(user.id),
  ]);

  return {
    profile,
    dbUnavailable,
    latestMeasurement,
    summary: buildDashboardSummary({
      fullName: profile.fullName,
      username: profile.username,
      goalType: profile.goalType,
      recentWorkouts: workouts,
      streakWorkoutDates,
      weeklyWorkoutDates,
      totalWorkoutCount,
      latestMeasurement,
    }),
  };
}

export async function loadDashboardWeeklyFrequency(userId: string) {
  const weeklyWorkoutDates = await getDashboardWeeklyWorkoutDates(userId);
  return buildWeeklyFrequencyLastNWeeks(weeklyWorkoutDates, DASHBOARD_WEEK_COUNT);
}

export async function loadDashboardRecentSection(userId: string) {
  const [streakWorkoutDates, totalWorkoutCount, { workouts }] =
    await Promise.all([
      getDashboardStreakDates(userId),
      getDashboardWorkoutCount(userId),
      getDashboardRecentWorkouts(userId),
    ]);
  const uniqueStreakDates = [...new Set(streakWorkoutDates)];
  const streak = computeStreaks(uniqueStreakDates);

  return {
    recentWorkouts: workouts,
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalWorkouts: totalWorkoutCount,
    streakPeriods: buildStreakPeriods(uniqueStreakDates),
  };
}
