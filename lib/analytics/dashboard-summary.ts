import { weekKey } from "@/lib/analytics/date-range";
import { buildStreakPeriods } from "@/lib/analytics/streak-periods";
import { computeStreaks } from "@/lib/analytics/workout-stats";
import { GOAL_OPTIONS } from "@/lib/profile/labels";
import { formatWorkoutDate } from "@/lib/workout/format";
import type { WorkoutListItem } from "@/lib/db/queries/workouts";
import type { BodyMeasurement, GoalType } from "@/types";
import type {
  DashboardQuickAction,
  DashboardSummary,
} from "@/types/dashboard";
import type { WeeklyFrequencyPoint } from "@/types/analytics";

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatRecordedDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDate(date);
}

export function buildGreeting(
  fullName: string | null,
  username: string | null,
  now = new Date(),
): string {
  const hour = now.getHours();
  const period =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who =
    fullName?.trim() ||
    (username?.trim() ? username.trim() : null) ||
    "there";
  return `${period}, ${who}`;
}

export function lastNWeekKeys(n: number, anchor = new Date()): string[] {
  const currentWeek = weekKey(formatDate(anchor));
  const monday = new Date(`${currentWeek}T12:00:00`);
  const keys: string[] = [];

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(monday);
    d.setDate(d.getDate() - i * 7);
    keys.push(weekKey(formatDate(d)));
  }

  return [...new Set(keys)].sort();
}

export function buildWeeklyFrequencyLastNWeeks(
  workoutDates: string[],
  n = 4,
): WeeklyFrequencyPoint[] {
  const weeks = lastNWeekKeys(n);
  const sessionsByWeek = new Map<string, number>();

  for (const week of weeks) {
    sessionsByWeek.set(week, 0);
  }

  for (const date of workoutDates) {
    const week = weekKey(date);
    if (sessionsByWeek.has(week)) {
      sessionsByWeek.set(week, (sessionsByWeek.get(week) ?? 0) + 1);
    }
  }

  return weeks.map((week) => ({
    week,
    sessions: sessionsByWeek.get(week) ?? 0,
  }));
}

export function countWorkoutsThisWeek(
  workoutDates: string[],
  anchor = new Date(),
): number {
  const thisWeek = weekKey(formatDate(anchor));
  return workoutDates.filter((date) => weekKey(date) === thisWeek).length;
}

function goalLabel(goalType: GoalType | null): string | null {
  if (!goalType) return null;
  return GOAL_OPTIONS.find((o) => o.value === goalType)?.label ?? goalType;
}

function formatLastWorkoutStat(workout: WorkoutListItem | null): string {
  if (!workout) return "None yet";
  return formatWorkoutDate(workout.date);
}

function formatWeightStat(
  weightKg: number | null,
  recordedAt: string | null,
): string {
  if (weightKg == null) return "—";
  if (recordedAt) {
    return `${weightKg} kg`;
  }
  return `${weightKg} kg`;
}

export const DASHBOARD_QUICK_ACTIONS: DashboardQuickAction[] = [
  {
    href: "/workouts/new",
    label: "Start workout",
    variant: "primary",
  },
  {
    href: "/progress/measurements/new",
    label: "Log measurement",
    variant: "secondary",
  },
];

export type BuildDashboardSummaryInput = {
  fullName: string | null;
  username: string | null;
  goalType: GoalType | null;
  recentWorkouts: WorkoutListItem[];
  allWorkoutDates: string[];
  latestMeasurement: BodyMeasurement | null;
};

export function buildDashboardSummary(
  input: BuildDashboardSummaryInput,
): DashboardSummary {
  const {
    fullName,
    username,
    goalType,
    recentWorkouts,
    allWorkoutDates,
    latestMeasurement,
  } = input;

  const lastWorkout = recentWorkouts[0] ?? null;
  const uniqueWorkoutDates = [...new Set(allWorkoutDates)];
  const streak = computeStreaks(uniqueWorkoutDates);
  const workoutsThisWeek = countWorkoutsThisWeek(allWorkoutDates);
  const latestBodyWeightKg =
    latestMeasurement?.weightKg != null
      ? Number(latestMeasurement.weightKg)
      : null;
  const latestBodyWeightRecordedAt = latestMeasurement
    ? formatRecordedDate(latestMeasurement.recordedAt)
    : null;

  const goalTypeLabel = goalLabel(goalType);

  return {
    greeting: buildGreeting(fullName, username),
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalWorkouts: uniqueWorkoutDates.length,
    streakPeriods: buildStreakPeriods(uniqueWorkoutDates),
    stats: [
      { label: "Last workout", value: formatLastWorkoutStat(lastWorkout) },
      {
        label: "This week",
        value: String(workoutsThisWeek),
      },
      {
        label: "Streak",
        value:
          streak.current === 0
            ? "0 days"
            : `${streak.current} day${streak.current === 1 ? "" : "s"}`,
      },
      {
        label: "Latest weight",
        value: formatWeightStat(latestBodyWeightKg, latestBodyWeightRecordedAt),
      },
    ],
    lastWorkout,
    recentWorkouts: recentWorkouts.slice(0, 5),
    weeklyFrequency: buildWeeklyFrequencyLastNWeeks(allWorkoutDates, 4),
    quickActions: DASHBOARD_QUICK_ACTIONS,
    goal: goalType && goalTypeLabel ? { type: goalType, label: goalTypeLabel } : null,
    latestBodyWeightKg,
    latestBodyWeightRecordedAt,
  };
}
