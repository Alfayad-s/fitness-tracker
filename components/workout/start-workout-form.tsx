"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TodaysWorkoutCard } from "@/components/workout/todays-workout-card";
import {
  buildStartWorkoutFromDailyPlanInput,
  buildStartWorkoutFromTemplateInput,
} from "@/lib/workout/template-to-session";
import { todayDateString } from "@/lib/workout/format";
import { acceptDailyWorkoutPlanAction } from "@/services/daily-plan-actions";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
} from "@/types/workout-session";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import {
  startWorkoutFormSchema,
  type StartWorkoutFormValues,
} from "@/types/schemas/workout";
import type { DailyWorkoutPlanDetail } from "@/types/schemas/daily-plan";
import type {
  WorkoutTemplateDetail,
  WorkoutTemplateSummary,
} from "@/types/schemas/workout-template";

type StartWorkoutFormProps = {
  userId: string;
  templates: WorkoutTemplateSummary[];
  templateDetails: Record<string, WorkoutTemplateDetail>;
  dailyPlan: DailyWorkoutPlanDetail | null;
};

export function StartWorkoutForm({
  userId,
  templates,
  templateDetails,
  dailyPlan,
}: StartWorkoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPlan = searchParams.get("from") === "plan";
  const autoStartedRef = useRef(false);

  const session = useWorkoutSessionStore((s) => s.session);
  const startWorkout = useWorkoutSessionStore((s) => s.startWorkout);
  const discardWorkout = useWorkoutSessionStore((s) => s.discardWorkout);

  const inProgress =
    session && isWorkoutSessionInProgress(getWorkoutSessionStatus(session));

  const [templateBusy, setTemplateBusy] = useState<string | null>(null);
  const [autoStartError, setAutoStartError] = useState<string | null>(null);

  const planTemplate =
    dailyPlan?.templateId != null
      ? (templateDetails[dailyPlan.templateId] ?? null)
      : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartWorkoutFormValues>({
    defaultValues: {
      title: dailyPlan?.title ?? "Workout",
      date: dailyPlan?.planDate ?? todayDateString(),
      notes: "",
    },
  });

  const confirmReplace = () => {
    if (!inProgress) return true;
    const replace = window.confirm(
      "You already have a workout in progress. Starting a new one will discard it.",
    );
    if (replace) discardWorkout();
    return replace;
  };

  const startFromDailyPlan = async (): Promise<boolean> => {
    if (!dailyPlan || dailyPlan.exercises.length === 0) {
      setAutoStartError("No exercises in this plan.");
      return false;
    }
    if (!confirmReplace()) return false;

    setTemplateBusy("plan");
    setAutoStartError(null);

    await acceptDailyWorkoutPlanAction(dailyPlan.planDate);

    const payload = buildStartWorkoutFromDailyPlanInput({
      userId,
      plan: {
        planDate: dailyPlan.planDate,
        title: dailyPlan.title,
        exercises: dailyPlan.exercises,
      },
      template: planTemplate,
    });

    if (payload.exercises.length === 0) {
      setTemplateBusy(null);
      setAutoStartError("Could not load exercises for this plan.");
      return false;
    }

    startWorkout(payload);
    setTemplateBusy(null);
    router.push("/workouts/active");
    return true;
  };

  useEffect(() => {
    if (!fromPlan || autoStartedRef.current || !dailyPlan) return;
    autoStartedRef.current = true;
    void startFromDailyPlan();
  }, [fromPlan, dailyPlan]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = handleSubmit((values) => {
    const parsed = startWorkoutFormSchema.safeParse(values);
    if (!parsed.success) return;
    if (!confirmReplace()) return;

    startWorkout({
      userId,
      title: parsed.data.title,
      date: parsed.data.date,
      notes: parsed.data.notes,
    });

    router.push("/workouts/active");
  });

  const startFromTemplate = (templateId: string) => {
    const template = templateDetails[templateId];
    if (!template) return;
    if (!confirmReplace()) return;

    setTemplateBusy(templateId);
    const payload = buildStartWorkoutFromTemplateInput({
      userId,
      title: template.name,
      date: todayDateString(),
      template,
    });

    startWorkout(payload);
    setTemplateBusy(null);
    router.push("/workouts/active");
  };

  return (
    <div className="space-y-8">
      {fromPlan && templateBusy === "plan" ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Starting your planned workout…
        </div>
      ) : null}

      {autoStartError ? (
        <p className="text-sm text-destructive" role="alert">
          {autoStartError}
        </p>
      ) : null}

      {dailyPlan && dailyPlan.status !== "skipped" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {dailyPlan.planDate === todayDateString()
              ? "Today's plan"
              : "Scheduled plan"}
          </h2>
          <TodaysWorkoutCard
            plan={dailyPlan}
            userId={userId}
            template={planTemplate}
          />
        </section>
      ) : null}

      {templates.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              My templates
            </h2>
            <Link
              href="/workouts/templates"
              className="text-xs font-medium underline"
            >
              Manage
            </Link>
          </div>
          <ul className="space-y-2">
            {templates.slice(0, 6).map((template) => (
              <li key={template.id}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between py-3"
                  disabled={templateBusy != null}
                  onClick={() => startFromTemplate(template.id)}
                >
                  <span className="text-left">
                    <span className="block font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {template.exerciseCount} exercises
                    </span>
                  </span>
                  {templateBusy === template.id ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <span className="text-xs">Start →</span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Empty workout
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              {...register("title", { required: true })}
              placeholder="Push day"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              placeholder="Focus, energy, etc."
              {...register("notes")}
            />
          </div>

          <Button type="submit" className="h-12 w-full text-base">
            Start empty workout
          </Button>
        </form>
      </section>
    </div>
  );
}
