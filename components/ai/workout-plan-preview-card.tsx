"use client";

import { CalendarDays, Dumbbell } from "lucide-react";

import { ChatMarkdown } from "@/components/ai/chat-markdown";
import { formatPlanDateHeading } from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import { cn } from "@/lib/utils";
import type { WorkoutPlanResponseMeta } from "@/lib/ai/format-rich-workout-plan-response";
import type { WorkoutPlanPatch } from "@/types/schemas/daily-plan";

type WorkoutPlanPreviewCardProps = {
  patch: WorkoutPlanPatch;
  meta?: WorkoutPlanResponseMeta;
  className?: string;
};

export function WorkoutPlanPreviewCard({
  patch,
  meta,
  className,
}: WorkoutPlanPreviewCardProps) {
  const dateLabel = formatPlanDateHeading(patch.planDate, todayDateString());
  const exercises =
    patch.replaceExercises ?? patch.addExercises ?? [];

  if (patch.status === "skipped") {
    return (
      <div className={cn("space-y-3", className)}>
        {meta ? (
          <div className="text-sm leading-relaxed text-neutral-700">
            <ChatMarkdown text={meta.intro} />
            {meta.summary ? (
              <p className="mt-2 text-neutral-500">{meta.summary}</p>
            ) : null}
          </div>
        ) : null}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Rest day
          </p>
          <p className="mt-1 text-base font-semibold text-neutral-900">
            {dateLabel}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            This day will be marked as skipped — no workout scheduled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {meta ? (
        <div className="text-sm leading-relaxed text-neutral-700">
          <ChatMarkdown text={meta.intro} />
          {meta.summary ? (
            <p className="mt-2 text-neutral-500">{meta.summary}</p>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Workout plan
              </p>
              <h3 className="mt-0.5 text-base font-semibold leading-snug text-neutral-900">
                {patch.title ?? "Updated plan"}
              </h3>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-medium text-white">
              <CalendarDays className="size-3" />
              {dateLabel}
            </span>
          </div>
        </div>

        {exercises.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {exercises.map((ex, index) => (
              <li
                key={`${ex.exerciseName}-${index}`}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                  <Dumbbell className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{ex.exerciseName}</p>
                  {ex.muscleGroup ? (
                    <p className="text-xs capitalize text-neutral-500">
                      {ex.muscleGroup}
                    </p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right text-sm tabular-nums text-neutral-700">
                  {ex.targetSets != null ? (
                    <>
                      <span className="font-semibold">{ex.targetSets}</span>
                      <span className="text-neutral-400"> × </span>
                      <span className="font-semibold">
                        {ex.targetReps ?? "?"}
                      </span>
                      <p className="text-[10px] uppercase tracking-wide text-neutral-400">
                        sets × reps
                      </p>
                    </>
                  ) : (
                    <span className="text-neutral-400">TBD</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-sm text-neutral-500">
            No exercises listed yet.
          </p>
        )}

        {patch.removeExerciseNames?.length ? (
          <div className="border-t border-neutral-100 bg-amber-50/50 px-4 py-2.5">
            <p className="text-xs text-amber-900">
              Remove: {patch.removeExerciseNames.join(", ")}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
