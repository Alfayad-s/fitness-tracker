import type { User as SupabaseUser } from "@supabase/supabase-js";

import {
  buildExercisePrsFromSetRows,
  formatBodyMeasurementRow,
  formatWorkoutDetailForContext,
  truncateAiContext,
} from "@/lib/ai/format-user-context";
import { getDateRange } from "@/lib/analytics/date-range";
import { countWorkoutsThisWeek } from "@/lib/analytics/dashboard-summary";
import { buildWorkoutAnalytics } from "@/lib/analytics/workout-stats";
import {
  fetchAllWorkoutDates,
  fetchSetRowsForAnalytics,
  fetchWorkoutDatesInRange,
  fetchExercisesUsedByUser,
} from "@/lib/db/queries/analytics";
import { listBodyMeasurementsByUser } from "@/lib/db/queries/body-measurements";
import {
  getDailyPlanForUser,
  listUpcomingDailyPlansForUser,
} from "@/lib/db/queries/daily-plans";
import { listCustomExercisesForUser } from "@/lib/db/queries/exercises";
import { listWorkoutTemplatesForUser } from "@/lib/db/queries/workout-templates";
import {
  getWorkoutDetail,
  listWorkoutsByUser,
  type WorkoutDetail,
} from "@/lib/db/queries/workouts";
import { GOAL_OPTIONS, GENDER_OPTIONS } from "@/lib/profile/labels";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { todayDateString } from "@/lib/workout/format";
import { addDaysToDateString } from "@/lib/workout/plan-dates";

const RECENT_WORKOUT_DETAIL_LIMIT = 15;
const WORKOUT_LIST_LIMIT = 50;
const MEASUREMENT_LIMIT = 15;

function labelFromOptions<T extends string>(
  value: T | null,
  options: { value: T; label: string }[],
): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

async function loadRecentWorkoutDetails(
  userId: string,
  workoutIds: string[],
): Promise<WorkoutDetail[]> {
  const ids = workoutIds.slice(0, RECENT_WORKOUT_DETAIL_LIMIT);
  const results = await Promise.all(
    ids.map((id) => getWorkoutDetail(id, userId)),
  );
  return results.filter((d): d is WorkoutDetail => d != null);
}

/**
 * Builds a text snapshot of the signed-in user's Fitness Tracker data
 * for injection into the AI system prompt (refreshed every chat request).
 */
export async function buildUserAiContext(
  authUser: SupabaseUser,
): Promise<string> {
  const userId = authUser.id;
  const range90 = getDateRange("90d");

  const [
    profile,
    { workouts: workoutList, dbUnavailable: workoutsUnavailable },
    { measurements, dbUnavailable: measurementsUnavailable },
    allDates,
    setRows90,
    dates90,
    exercisesUsed,
    dailyPlan,
    templates,
    customExercises,
  ] = await Promise.all([
    getUserProfile(authUser),
    listWorkoutsByUser(userId, { limit: WORKOUT_LIST_LIMIT }),
    listBodyMeasurementsByUser(userId, MEASUREMENT_LIMIT),
    fetchAllWorkoutDates(userId),
    fetchSetRowsForAnalytics(userId, range90),
    fetchWorkoutDatesInRange(userId, range90),
    fetchExercisesUsedByUser(userId),
    getDailyPlanForUser(userId, todayDateString()),
    listWorkoutTemplatesForUser(userId),
    listCustomExercisesForUser(userId),
  ]);

  const recentDetails = await loadRecentWorkoutDetails(
    userId,
    workoutList.map((w) => w.id),
  );

  const today = todayDateString();
  const upcomingPlans = await listUpcomingDailyPlansForUser(
    userId,
    addDaysToDateString(today, 1),
    addDaysToDateString(today, 7),
  );

  const analytics90 = buildWorkoutAnalytics(
    setRows90,
    dates90,
    allDates,
  );
  const prs = buildExercisePrsFromSetRows(setRows90).slice(0, 20);
  const workoutsThisWeek = countWorkoutsThisWeek(allDates);

  const sections: string[] = [];

  if (workoutsUnavailable && measurementsUnavailable) {
    sections.push(
      "Note: Workout database is temporarily unavailable. Answer from general fitness knowledge and say you cannot see their logged data right now.",
    );
  }

  const profileLines = [
    profile.fullName ? `Name: ${profile.fullName}` : null,
    profile.username ? `Username: ${profile.username}` : null,
    labelFromOptions(profile.goalType, GOAL_OPTIONS)
      ? `Goal: ${labelFromOptions(profile.goalType, GOAL_OPTIONS)}`
      : null,
    labelFromOptions(profile.gender, GENDER_OPTIONS)
      ? `Gender: ${labelFromOptions(profile.gender, GENDER_OPTIONS)}`
      : null,
    profile.heightCm ? `Height: ${profile.heightCm} cm` : null,
  ].filter(Boolean);

  sections.push(
    "## Profile",
    profileLines.length ? profileLines.join("\n") : "No profile details saved yet.",
  );

  sections.push(
    "## Training summary",
    `Total workouts logged (all time): ${allDates.length}`,
    `Workouts in last 90 days: ${analytics90.totalWorkouts}`,
    `Workouts this week: ${workoutsThisWeek}`,
    `Current streak: ${analytics90.currentStreak} day(s)`,
    `Longest streak: ${analytics90.longestStreak} day(s)`,
    `Training volume last 90 days: ${analytics90.totalVolumeKg} kg (working sets)`,
  );

  if (exercisesUsed.length > 0) {
    sections.push(
      "## Exercises they have performed",
      exercisesUsed.map((e) => e.name).join(", "),
    );
  }

  if (customExercises.length > 0) {
    sections.push(
      "## Custom exercise catalog",
      customExercises.map((e) => `${e.name} (${e.muscleGroup})`).join(", "),
    );
  }

  if (templates.length > 0) {
    sections.push(
      "## Saved workout templates",
      templates
        .slice(0, 12)
        .map((t) => `- ${t.name} (${t.exerciseCount} exercises)`)
        .join("\n"),
    );
  }

  if (dailyPlan) {
    const planLines = [
      "## Today's workout plan",
      `Date: ${dailyPlan.planDate}`,
      `Title: ${dailyPlan.title}`,
      `Status: ${dailyPlan.status}`,
      dailyPlan.aiRationale ? `Rationale: ${dailyPlan.aiRationale}` : null,
      dailyPlan.exercises.length
        ? `Exercises: ${dailyPlan.exercises.map((e) => e.exerciseName).join(", ")}`
        : "Exercises: none (rest or TBD)",
    ].filter(Boolean) as string[];
    sections.push(...planLines);
  }

  if (upcomingPlans.length > 0) {
    sections.push(
      "## Upcoming workout plans (saved)",
      ...upcomingPlans.map(
        (p) =>
          `- ${p.planDate}: ${p.title} (${p.status}) — ${p.exercises.map((e) => e.exerciseName).join(", ") || "rest/TBD"}`,
      ),
    );
  }

  if (prs.length > 0) {
    sections.push(
      "## Recent strength highlights (90 days, estimated 1RM)",
      ...prs.map(
        (p) =>
          `- ${p.exerciseName}: ~${p.estimated1RmKg}kg e1RM (best set ${p.maxWeightKg}kg on ${p.date})`,
      ),
    );
  }

  if (!measurementsUnavailable && measurements.length > 0) {
    sections.push(
      "## Body measurements (newest first)",
      ...measurements.map((m) => `- ${formatBodyMeasurementRow(m)}`),
    );
  } else {
    sections.push("## Body measurements", "None logged yet.");
  }

  if (recentDetails.length > 0) {
    sections.push(
      `## Recent workouts (up to ${RECENT_WORKOUT_DETAIL_LIMIT}, with sets)`,
      ...recentDetails.map((w) => formatWorkoutDetailForContext(w)),
    );
  } else if (!workoutsUnavailable) {
    sections.push("## Recent workouts", "No workouts logged yet.");
  }

  if (workoutList.length > recentDetails.length) {
    const summaryOnly = workoutList.slice(recentDetails.length);
    sections.push(
      "## Older workout titles (no set detail in this context)",
      ...summaryOnly.map(
        (w) =>
          `- ${w.date} | ${w.title} | ${w.exerciseCount} exercises, ${w.setCount} sets`,
      ),
    );
  }

  sections.push(
    "## Instructions for using this data",
    "- Reference their actual numbers, dates, and exercise names when relevant.",
    "- If they ask about something not in this snapshot, say what you can see and what is missing.",
    "- Never fabricate workouts, sets, or measurements they have not logged.",
  );

  return truncateAiContext(sections.join("\n\n"));
}
