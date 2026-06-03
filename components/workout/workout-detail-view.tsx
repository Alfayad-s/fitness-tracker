"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  formatWorkoutDate,
  formatWorkoutDuration,
  feelingLabel,
} from "@/lib/workout/format";
import type { WorkoutDetail } from "@/lib/db/queries/workouts";
import { deleteWorkout } from "@/services/workout-actions";

type WorkoutDetailViewProps = {
  workout: WorkoutDetail;
};

export function WorkoutDetailView({ workout }: WorkoutDetailViewProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this workout permanently? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    const result = await deleteWorkout(workout.id);
    setDeleting(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.push("/workouts");
    router.refresh();
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {workout.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWorkoutDate(workout.date)}
          {workout.duration != null &&
            ` · ${formatWorkoutDuration(workout.duration)}`}
          {workout.feeling && ` · ${feelingLabel(workout.feeling)}`}
        </p>
      </header>

      <div className="space-y-4">
        {workout.workoutExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exercises logged.</p>
        ) : (
          workout.workoutExercises.map((we) => (
            <section
              key={we.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <h2 className="font-semibold">{we.exercise.name}</h2>
              <p className="text-xs capitalize text-muted-foreground">
                {we.exercise.muscleGroup}
              </p>
              {we.sets.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {we.sets.map((set, i) => (
                    <li
                      key={set.id}
                      className="flex justify-between text-sm tabular-nums"
                    >
                      <span className="text-muted-foreground">Set {i + 1}</span>
                      <span>
                        {set.weightKg != null ? `${set.weightKg} kg` : "—"}
                        {" × "}
                        {set.reps ?? "—"} reps
                        {set.rpe != null ? ` @ RPE ${set.rpe}` : ""}
                        {set.isWarmup ? " (warmup)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No sets</p>
              )}
            </section>
          ))
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href={`/workouts/${workout.id}/edit`}>
          <Pencil className="size-4" />
          Edit workout
        </Link>
      </Button>

      <Button
        type="button"
        variant="destructive"
        className="w-full"
        disabled={deleting}
        onClick={handleDelete}
      >
        {deleting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Deleting…
          </>
        ) : (
          <>
            <Trash2 className="size-4" />
            Delete workout
          </>
        )}
      </Button>
    </main>
  );
}
