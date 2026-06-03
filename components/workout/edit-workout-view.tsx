"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import {
  WorkoutEditorProvider,
  useWorkoutEditor,
} from "@/components/workout/workout-editor-context";
import type { WorkoutDetail } from "@/lib/db/queries/workouts";
import { workoutDetailToEditableSession } from "@/lib/workout/map-detail-to-session";
import { FEELING_OPTIONS } from "@/lib/workout/format";
import { cn } from "@/lib/utils";
import { updateCompletedWorkout } from "@/services/workout-actions";
import type { Feeling } from "@/types";
import type { SaveWorkoutSessionInput } from "@/types/schemas/workout";

type EditWorkoutViewProps = {
  workout: WorkoutDetail;
  userId: string;
};

type EditWorkoutContentProps = {
  baseSession: SaveWorkoutSessionInput;
  workoutId: string;
};

function EditWorkoutContent({ baseSession, workoutId }: EditWorkoutContentProps) {
  const router = useRouter();
  const editor = useWorkoutEditor();

  const [title, setTitle] = useState(baseSession.title);
  const [date, setDate] = useState(baseSession.date);
  const [feeling, setFeeling] = useState<Feeling | null>(baseSession.feeling);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moveExercise = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= editor.exercises.length) return;
    const ids = editor.exercises.map((e) => e.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    editor.reorderExercises(ids);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await updateCompletedWorkout({
      workoutId,
      ...baseSession,
      title: title.trim(),
      date,
      feeling,
      exercises: editor.exercises,
    });

    setSaving(false);

    if (!("success" in result) || !result.success) {
      setError("error" in result ? result.error : "Could not save changes.");
      return;
    }

    router.push(`/workouts/${workoutId}`);
    router.refresh();
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-28">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">
            Edit workout
          </h1>
        </header>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <label htmlFor="edit-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="edit-date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="edit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Feeling</p>
            <div className="grid grid-cols-5 gap-2">
              {FEELING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFeeling(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border p-2 text-xs",
                    feeling === opt.value
                      ? "border-primary bg-primary/10"
                      : "border-border",
                  )}
                >
                  <span>{opt.emoji}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {editor.exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add at least one exercise.
          </p>
        ) : (
          <div className="space-y-4">
            {editor.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onMoveUp={() => moveExercise(index, -1)}
                onMoveDown={() => moveExercise(index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < editor.exercises.length - 1}
              />
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setPickerOpen(true)}
        >
          <Plus className="size-4" />
          Add exercise
        </Button>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="h-12 w-full text-base"
          disabled={saving || editor.exercises.length === 0 || !title.trim()}
          onClick={handleSave}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </main>

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}

export function EditWorkoutView({ workout, userId }: EditWorkoutViewProps) {
  const baseSession = useMemo(
    () => workoutDetailToEditableSession(workout, userId),
    [workout, userId],
  );

  return (
    <WorkoutEditorProvider initial={baseSession}>
      <EditWorkoutContent
        baseSession={baseSession}
        workoutId={workout.id}
      />
    </WorkoutEditorProvider>
  );
}
