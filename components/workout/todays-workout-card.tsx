"use client";

import { Loader2, RefreshCw, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { buildStartWorkoutFromDailyPlanInput } from "@/lib/workout/template-to-session";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
} from "@/types/workout-session";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import {
  acceptDailyWorkoutPlanAction,
  regenerateDailyWorkoutPlanAction,
  skipDailyWorkoutPlanAction,
} from "@/services/daily-plan-actions";
import type { DailyWorkoutPlanDetail } from "@/types/schemas/daily-plan";
import type { WorkoutTemplateDetail } from "@/types/schemas/workout-template";

type TodaysWorkoutCardProps = {
  plan: DailyWorkoutPlanDetail | null;
  compact?: boolean;
  /** When set with template/plan exercises, Accept & start launches the session. */
  userId?: string;
  template?: WorkoutTemplateDetail | null;
};

export function TodaysWorkoutCard({
  plan,
  compact = false,
  userId,
  template = null,
}: TodaysWorkoutCardProps) {
  const router = useRouter();
  const session = useWorkoutSessionStore((s) => s.session);
  const startWorkout = useWorkoutSessionStore((s) => s.startWorkout);
  const discardWorkout = useWorkoutSessionStore((s) => s.discardWorkout);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!plan || plan.status === "skipped") {
    if (compact) return null;
    return (
      <section className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        No workout planned for today.{" "}
        <Link href="/workouts/new" className="underline">
          Start a workout
        </Link>
      </section>
    );
  }

  const isRest =
    plan.exercises.length === 0 &&
    plan.title.toLowerCase().includes("rest");

  const canStartSession =
    Boolean(userId) &&
    !isRest &&
    plan.exercises.length > 0 &&
    (template || plan.exercises.some((ex) => ex.exerciseId));

  const confirmReplace = () => {
    const inProgress =
      session && isWorkoutSessionInProgress(getWorkoutSessionStatus(session));
    if (!inProgress) return true;
    const replace = window.confirm(
      "You already have a workout in progress. Starting a new one will discard it.",
    );
    if (replace) discardWorkout();
    return replace;
  };

  const startSessionFromPlan = () => {
    if (!userId || !canStartSession) return false;

    const payload = buildStartWorkoutFromDailyPlanInput({
      userId,
      plan: {
        planDate: plan.planDate,
        title: plan.title,
        exercises: plan.exercises,
      },
      template,
    });

    if (payload.exercises.length === 0) {
      setError("This plan has no exercises to start.");
      return false;
    }

    startWorkout(payload);
    return true;
  };

  const handleAccept = async () => {
    setBusy("accept");
    setError(null);

    if (!confirmReplace()) {
      setBusy(null);
      return;
    }

    const result = await acceptDailyWorkoutPlanAction(plan.planDate);
    if ("error" in result && result.error) {
      setBusy(null);
      setError(result.error);
      return;
    }

    if (canStartSession && userId) {
      const started = startSessionFromPlan();
      setBusy(null);
      if (started) {
        router.push("/workouts/active");
        return;
      }
      return;
    }

    setBusy(null);
    router.push(
      `/workouts/new?planDate=${encodeURIComponent(plan.planDate)}&from=plan`,
    );
    router.refresh();
  };

  const handleSkip = async () => {
    setBusy("skip");
    setError(null);
    const result = await skipDailyWorkoutPlanAction(plan.planDate);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handleRegenerate = async () => {
    setBusy("regen");
    setError(null);
    const result = await regenerateDailyWorkoutPlanAction(plan.planDate);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const planLink = `/workouts/new?planDate=${encodeURIComponent(plan.planDate)}&from=plan`;

  return (
    <section
      className={`rounded-xl border border-border bg-card shadow-sm ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Today&apos;s workout
          </p>
          <h2 className={`font-semibold ${compact ? "text-base" : "text-lg"}`}>
            {plan.title}
          </h2>
          {plan.aiRationale && !compact ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {plan.aiRationale}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
          {plan.status}
        </span>
      </div>

      {!isRest && plan.exercises.length > 0 ? (
        <ul className={`mt-3 space-y-1 text-sm ${compact ? "line-clamp-2" : ""}`}>
          {plan.exercises.slice(0, compact ? 3 : 6).map((ex) => (
            <li key={ex.exerciseId ?? ex.exerciseName} className="text-muted-foreground">
              • {ex.exerciseName}
              {ex.targetSets ? ` — ${ex.targetSets}×${ex.targetReps ?? "?"}` : ""}
            </li>
          ))}
          {compact && plan.exercises.length > 3 ? (
            <li className="text-xs text-muted-foreground">
              +{plan.exercises.length - 3} more
            </li>
          ) : null}
        </ul>
      ) : isRest ? (
        <p className="mt-2 text-sm text-muted-foreground">Rest day — recover well.</p>
      ) : null}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!compact && plan.status !== "completed" && !isRest ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={busy != null}
            onClick={handleAccept}
          >
            {busy === "accept" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Accept & start"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy != null}
            onClick={handleRegenerate}
          >
            {busy === "regen" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="size-4" />
                Regenerate
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy != null}
            onClick={handleSkip}
          >
            {busy === "skip" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <SkipForward className="size-4" />
                Skip
              </>
            )}
          </Button>
        </div>
      ) : compact && !isRest && plan.exercises.length > 0 ? (
        <Link
          href={planLink}
          className="mt-2 inline-block text-sm font-medium underline"
        >
          Accept & start →
        </Link>
      ) : compact ? (
        <Link
          href={planLink}
          className="mt-2 inline-block text-sm font-medium underline"
        >
          View plan →
        </Link>
      ) : null}
    </section>
  );
}
