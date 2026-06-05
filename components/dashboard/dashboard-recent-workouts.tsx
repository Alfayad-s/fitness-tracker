import Link from "next/link";

import {
  formatWorkoutDate,
  formatWorkoutDuration,
} from "@/lib/workout/format";
import type { WorkoutListItem } from "@/lib/db/queries/workouts";

type DashboardRecentWorkoutsProps = {
  workouts: WorkoutListItem[];
};

export function DashboardRecentWorkouts({
  workouts,
}: DashboardRecentWorkoutsProps) {
  if (workouts.length === 0) {
    return (
      <p className="rounded-xl bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No workouts yet. Start your first session below.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {workouts.map((workout) => (
        <li key={workout.id}>
          <Link
            href={`/workouts/${workout.id}`}
            className="flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{workout.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatWorkoutDate(workout.date)}
                {workout.exerciseCount > 0 &&
                  ` · ${workout.exerciseCount} exercise${workout.exerciseCount === 1 ? "" : "s"}`}
              </p>
            </div>
            {workout.duration != null && (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatWorkoutDuration(workout.duration)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
