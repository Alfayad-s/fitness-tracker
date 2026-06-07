"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { formatPlanDateHeading } from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import type { DailyWorkoutPlanDetail } from "@/types/schemas/daily-plan";

type UpcomingWorkoutPlansCardProps = {
  plans: DailyWorkoutPlanDetail[];
};

function PlanRow({ plan }: { plan: DailyWorkoutPlanDetail }) {
  const isRest =
    plan.exercises.length === 0 && plan.title.toLowerCase().includes("rest");
  const dateLabel = formatPlanDateHeading(plan.planDate, todayDateString());
  const startHref = `/workouts/new?planDate=${encodeURIComponent(plan.planDate)}&from=plan`;

  return (
    <li className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{dateLabel}</p>
          <p className="font-medium">{plan.title}</p>
          {!isRest && plan.exercises.length > 0 ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {plan.exercises
                .slice(0, 3)
                .map((ex) => ex.exerciseName)
                .join(" · ")}
              {plan.exercises.length > 3
                ? ` +${plan.exercises.length - 3}`
                : ""}
            </p>
          ) : isRest ? (
            <p className="mt-0.5 text-xs text-muted-foreground">Rest day</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">
            {plan.status}
          </span>
          {!isRest && plan.exercises.length > 0 ? (
            <Link
              href={startHref}
              className="text-xs font-medium underline"
            >
              Start →
            </Link>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function UpcomingWorkoutPlansCard({
  plans,
}: UpcomingWorkoutPlansCardProps) {
  if (plans.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-border p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4 text-muted-foreground" />
          Upcoming workouts
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No future plans yet. Ask the{" "}
          <Link href="/ai" className="underline">
            AI coach
          </Link>{" "}
          to plan tomorrow or a specific date, e.g. &quot;Plan a leg day for
          tomorrow&quot;.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Upcoming workouts</h2>
        </div>
        <Link href="/ai" className="text-xs font-medium underline">
          Plan with AI
        </Link>
      </div>
      <ul className="space-y-2">
        {plans.map((plan) => (
          <PlanRow key={plan.id} plan={plan} />
        ))}
      </ul>
    </section>
  );
}
