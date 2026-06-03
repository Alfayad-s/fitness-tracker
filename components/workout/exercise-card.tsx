"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SetRow } from "@/components/workout/set-row";
import type { ClientId, SessionExercise } from "@/types";
import { useOptionalWorkoutEditor } from "@/components/workout/workout-editor-context";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";

type ExerciseCardProps = {
  exercise: SessionExercise;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

export function ExerciseCard({
  exercise,
  disabled,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ExerciseCardProps) {
  const editor = useOptionalWorkoutEditor();
  const addSetStore = useWorkoutSessionStore((s) => s.addSet);
  const removeExerciseStore = useWorkoutSessionStore((s) => s.removeExercise);
  const addSet = editor?.addSet ?? addSetStore;
  const removeExercise = editor?.removeExercise ?? removeExerciseStore;

  const handleRemove = () => {
    if (
      window.confirm(`Remove ${exercise.name} and all its sets from this workout?`)
    ) {
      removeExercise(exercise.id);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{exercise.name}</h3>
          <p className="text-xs capitalize text-muted-foreground">
            {exercise.muscleGroup}
            {exercise.equipment ? ` · ${exercise.equipment}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
            aria-label="Move exercise up"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
            aria-label="Move exercise down"
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={handleRemove}
            aria-label="Remove exercise"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-center">#</span>
        <span className="text-center">kg</span>
        <span className="text-center">reps</span>
        <span className="text-center">RPE</span>
        <span className="w-14" />
      </div>

      <div className="mt-1 space-y-2">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            exerciseId={exercise.id as ClientId}
            set={set}
            index={i}
            disabled={disabled}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() => addSet(exercise.id)}
      >
        <Plus className="size-3.5" />
        Add set
      </Button>
    </section>
  );
}
