"use client";

import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ExerciseImportExtraction } from "@/types/schemas/exercise-import";

type ExerciseImportPreviewCardProps = {
  extraction: ExerciseImportExtraction;
  className?: string;
};

export function ExerciseImportPreviewCard({
  extraction,
  className,
}: ExerciseImportPreviewCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Exercises to import
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-neutral-900">
            {extraction.exercises.length} exercise
            {extraction.exercises.length === 1 ? "" : "s"}
          </h3>
        </div>
        <ul className="divide-y divide-neutral-100">
          {extraction.exercises.map((ex, index) => (
            <li
              key={`${ex.name}-${index}`}
              className="flex items-center gap-3 px-4 py-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Dumbbell className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{ex.name}</p>
                <p className="text-xs capitalize text-neutral-500">
                  {ex.muscleGroup ?? "Muscle group TBD"}
                </p>
              </div>
              {ex.targetSets != null && ex.targetReps != null ? (
                <span className="shrink-0 text-sm tabular-nums text-neutral-600">
                  {ex.targetSets}×{ex.targetReps}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-neutral-500">
        Confirm below to add these to your exercise library
        {extraction.applyTo === "today_plan" ? " and today's plan" : ""}.
      </p>
    </div>
  );
}
