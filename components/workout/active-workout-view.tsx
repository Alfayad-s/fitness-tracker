"use client";

import { Pause, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CompleteWorkoutSheet } from "@/components/workout/complete-workout-sheet";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { ExercisePicker } from "@/components/workout/exercise-picker";
import { RestTimerBar } from "@/components/workout/rest-timer-bar";
import { WorkoutTimer } from "@/components/workout/workout-timer";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
} from "@/types/workout-session";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";

type ActiveWorkoutViewProps = {
  userId: string;
};

export function ActiveWorkoutView({ userId }: ActiveWorkoutViewProps) {
  const router = useRouter();
  const session = useWorkoutSessionStore((s) => s.session);
  const pauseWorkout = useWorkoutSessionStore((s) => s.pauseWorkout);
  const resumeWorkout = useWorkoutSessionStore((s) => s.resumeWorkout);
  const reorderExercises = useWorkoutSessionStore((s) => s.reorderExercises);
  const discardWorkout = useWorkoutSessionStore((s) => s.discardWorkout);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const status = getWorkoutSessionStatus(session);
    if (status === "idle") {
      router.replace("/workouts/new");
      return;
    }

    if (session && session.userId !== userId) {
      discardWorkout();
      router.replace("/workouts/new");
    }
  }, [hydrated, session, userId, router, discardWorkout]);

  if (!hydrated || !session || !isWorkoutSessionInProgress(session.status)) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-6">
        <p className="text-sm text-muted-foreground">Loading workout…</p>
      </main>
    );
  }

  const paused = session.status === "paused";

  const moveExercise = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= session.exercises.length) return;
    const ids = session.exercises.map((e) => e.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    reorderExercises(ids);
  };

  const handleDiscard = () => {
    if (
      window.confirm(
        "Discard this workout? Your progress will not be saved.",
      )
    ) {
      discardWorkout();
      router.push("/workouts");
    }
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-4 pb-28">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {session.title}
            </h1>
            <WorkoutTimer />
          </div>
          <div className="flex shrink-0 gap-2">
            {paused ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resumeWorkout}
                aria-label="Resume workout"
              >
                <Play className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={pauseWorkout}
                aria-label="Pause workout"
              >
                <Pause className="size-4" />
              </Button>
            )}
          </div>
        </header>

        {session.exercises.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Add your first exercise to start logging sets.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {session.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                disabled={paused}
                canMoveUp={index > 0}
                canMoveDown={index < session.exercises.length - 1}
                onMoveUp={() => moveExercise(index, -1)}
                onMoveDown={() => moveExercise(index, 1)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={paused}
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Add exercise
          </Button>
          <Button
            type="button"
            className="h-12 w-full text-base"
            disabled={paused || session.exercises.length === 0}
            onClick={() => setCompleteOpen(true)}
          >
            Finish workout
          </Button>
          <button
            type="button"
            onClick={handleDiscard}
            className="py-2 text-center text-sm text-muted-foreground hover:text-destructive"
          >
            Discard workout
          </button>
        </div>
      </main>

      <RestTimerBar />
      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} />
      <CompleteWorkoutSheet
        open={completeOpen}
        onOpenChange={setCompleteOpen}
      />
    </>
  );
}
