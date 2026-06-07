"use server";

import { revalidatePath } from "next/cache";

import { getRequestUser } from "@/lib/auth/require-user";
import {
  applyWorkoutPlanPatch,
  getDailyPlanForUser,
  listUpcomingDailyPlansForUser,
  updateDailyPlanStatus,
  upsertDailyPlanForUser,
} from "@/lib/db/queries/daily-plans";
import { getProgramDayTemplateForDate } from "@/lib/db/queries/workout-programs";
import {
  createWorkoutTemplate,
  getWorkoutTemplateForUser,
} from "@/lib/db/queries/workout-templates";
import { generateDailyWorkoutPlan } from "@/lib/ai/generate-daily-workout-plan";
import {
  resolveDailyPlanExercises,
} from "@/lib/workout/resolve-exercise-names";
import { todayDateString } from "@/lib/workout/format";
import { addDaysToDateString } from "@/lib/workout/plan-dates";
import {
  dayOfMonthFromDateString,
  getWeekDatesFromMondayStart,
  getWeekStartMonday,
  resolveWeekDayDisplay,
  WEEKDAY_LABELS_MON_FIRST,
  type WeekScheduleDay,
} from "@/lib/workout/week-schedule";
import {
  workoutPlanPatchSchema,
  type AiDailyPlanExtraction,
  type DailyWorkoutPlanDetail,
  type WorkoutPlanPatch,
} from "@/types/schemas/daily-plan";

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const user = await getRequestUser();
  if (!user) return { error: "You must be signed in." };
  return { userId: user.id };
}

async function saveGeneratedDailyPlan(
  userId: string,
  date: string,
  generated: AiDailyPlanExtraction,
): Promise<DailyWorkoutPlanDetail> {
  const resolved = await resolveDailyPlanExercises(
    userId,
    generated.exercises,
    true,
  );

  let templateId = generated.templateId ?? null;
  if (!templateId && resolved.length > 0) {
    const template = await createWorkoutTemplate(userId, {
      name: generated.title,
      description: generated.rationale,
      source: "ai",
      exercises: resolved.map((ex, index) => ({
        exerciseId: ex.exerciseId!,
        orderIndex: index,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeightKg: ex.targetWeightKg,
        notes: ex.notes,
      })),
    });
    templateId = template.id;
  }

  return upsertDailyPlanForUser(userId, date, {
    title: generated.title,
    templateId,
    status: "suggested",
    aiRationale: generated.rationale,
  });
}

function revalidatePlanPaths() {
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  revalidatePath("/workouts/new");
}

export async function fetchDailyWorkoutPlan(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const date = planDate ?? todayDateString();
  const plan = await getDailyPlanForUser(auth.userId, date);
  return { plan };
}

export async function fetchUpcomingWorkoutPlans(daysAhead = 7) {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, todayPlan: null, upcomingPlans: [] as const };
  }

  const today = todayDateString();
  const end = addDaysToDateString(today, daysAhead);
  const plans = await listUpcomingDailyPlansForUser(auth.userId, today, end);

  const todayPlan = plans.find((p) => p.planDate === today) ?? null;
  const upcomingPlans = plans.filter(
    (p) => p.planDate > today && p.status !== "skipped",
  );

  return { todayPlan, upcomingPlans };
}

export async function fetchWeekSchedule(weekStartDate?: string): Promise<
  | { error: string; weekStart: string; days: WeekScheduleDay[] }
  | { weekStart: string; days: WeekScheduleDay[] }
> {
  const auth = await requireUserId();
  if ("error" in auth) {
    return { error: auth.error, weekStart: todayDateString(), days: [] };
  }

  const today = todayDateString();
  const weekStart = weekStartDate
    ? getWeekStartMonday(weekStartDate)
    : getWeekStartMonday(today);
  const weekDates = getWeekDatesFromMondayStart(weekStart);
  const weekEnd = weekDates[6]!;

  const savedPlans = await listUpcomingDailyPlansForUser(
    auth.userId,
    weekStart,
    weekEnd,
  );
  const planByDate = new Map(savedPlans.map((plan) => [plan.planDate, plan]));

  const days: WeekScheduleDay[] = await Promise.all(
    weekDates.map(async (planDate, index) => {
      const plan = planByDate.get(planDate) ?? null;
      const programDay = await getProgramDayTemplateForDate(
        auth.userId,
        planDate,
      );

      let programHint = null;
      if (programDay) {
        let templateName: string | null = null;
        if (programDay.templateId) {
          const template = await getWorkoutTemplateForUser(
            programDay.templateId,
            auth.userId,
          );
          templateName = template?.name ?? null;
        }
        programHint = {
          label: programDay.label,
          isRestDay: programDay.isRestDay,
          templateId: programDay.templateId,
          templateName,
        };
      }

      const { displayStatus, displayTitle } = resolveWeekDayDisplay(
        plan,
        programHint,
      );

      return {
        planDate,
        weekdayLabel: WEEKDAY_LABELS_MON_FIRST[index]!,
        dayOfMonth: dayOfMonthFromDateString(planDate),
        isToday: planDate === today,
        plan,
        programHint,
        displayStatus,
        displayTitle,
      };
    }),
  );

  return { weekStart, days };
}

export async function ensureDailyWorkoutPlan(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const date = planDate ?? todayDateString();
  const existing = await getDailyPlanForUser(auth.userId, date);
  if (existing && existing.status !== "skipped") {
    return { plan: existing };
  }

  const programDay = await getProgramDayTemplateForDate(auth.userId, date);
  if (programDay?.isRestDay) {
    const plan = await upsertDailyPlanForUser(auth.userId, date, {
      title: programDay.label ?? "Rest day",
      templateId: null,
      status: "suggested",
      aiRationale: "Scheduled rest day from your active program.",
    });
    return { plan };
  }

  if (programDay?.templateId) {
    const template = await getWorkoutTemplateForUser(
      programDay.templateId,
      auth.userId,
    );
    if (template) {
      const plan = await upsertDailyPlanForUser(auth.userId, date, {
        title: programDay.label ?? template.name,
        templateId: template.id,
        status: "suggested",
        aiRationale: "From your active weekly program.",
      });
      return { plan };
    }
  }

  // AI auto-suggest only for today; future dates are planned explicitly via chat.
  if (date !== todayDateString()) {
    return { plan: existing };
  }

  try {
    const generated = await generateDailyWorkoutPlan(auth.userId, date);
    const plan = await saveGeneratedDailyPlan(auth.userId, date, generated);
    return { plan };
  } catch {
    return { error: "Could not generate today's workout plan.", plan: null };
  }
}

export async function setRestDayForPlanDateAction(planDate: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const plan = await upsertDailyPlanForUser(auth.userId, planDate, {
    title: "Rest day",
    templateId: null,
    status: "suggested",
    aiRationale: null,
  });
  revalidatePlanPaths();
  return { plan };
}

export async function suggestDailyWorkoutPlanAction(planDate: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  try {
    const generated = await generateDailyWorkoutPlan(auth.userId, planDate);
    const plan = await saveGeneratedDailyPlan(auth.userId, planDate, generated);
    revalidatePlanPaths();
    return { plan };
  } catch {
    return { error: "Could not generate a workout plan for that day.", plan: null };
  }
}

export async function assignTemplateToPlanDayAction(
  planDate: string,
  templateId: string,
) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const template = await getWorkoutTemplateForUser(templateId, auth.userId);
  if (!template) return { error: "Template not found.", plan: null };

  const plan = await upsertDailyPlanForUser(auth.userId, planDate, {
    title: template.name,
    templateId: template.id,
    status: "suggested",
    aiRationale: null,
  });
  revalidatePlanPaths();
  return { plan };
}

export async function acceptDailyWorkoutPlanAction(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const date = planDate ?? todayDateString();
  const plan = await updateDailyPlanStatus(auth.userId, date, "accepted");
  if (!plan) return { error: "No plan found for today.", plan: null };

  revalidatePlanPaths();
  return { plan };
}

export async function skipDailyWorkoutPlanAction(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const date = planDate ?? todayDateString();
  await updateDailyPlanStatus(auth.userId, date, "skipped");
  revalidatePlanPaths();
  return { success: true as const };
}

export async function completeDailyWorkoutPlanAction(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error };

  const date = planDate ?? todayDateString();
  await updateDailyPlanStatus(auth.userId, date, "completed");
  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function applyWorkoutPlanPatchAction(patch: WorkoutPlanPatch) {
  const parsed = workoutPlanPatchSchema.safeParse(patch);
  if (!parsed.success) return { error: "Invalid plan update." };

  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const resolvedAdd = parsed.data.addExercises
    ? await resolveDailyPlanExercises(auth.userId, parsed.data.addExercises, true)
    : undefined;
  const resolvedReplace = parsed.data.replaceExercises
    ? await resolveDailyPlanExercises(
        auth.userId,
        parsed.data.replaceExercises,
        true,
      )
    : undefined;

  const plan = await applyWorkoutPlanPatch(auth.userId, {
    ...parsed.data,
    addExercises: resolvedAdd,
    replaceExercises: resolvedReplace,
  });

  revalidatePlanPaths();
  revalidatePath("/ai");
  return { plan };
}

export async function regenerateDailyWorkoutPlanAction(planDate?: string) {
  const auth = await requireUserId();
  if ("error" in auth) return { error: auth.error, plan: null };

  const date = planDate ?? todayDateString();
  await updateDailyPlanStatus(auth.userId, date, "skipped");
  const result = await ensureDailyWorkoutPlan(date);
  revalidatePlanPaths();
  return result;
}
