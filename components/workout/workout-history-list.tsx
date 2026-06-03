import Link from "next/link";

import {
  formatWorkoutDate,
  formatWorkoutDuration,
  feelingLabel,
} from "@/lib/workout/format";
import type { WorkoutListItem } from "@/lib/db/queries/workouts";

type WorkoutHistoryListProps = {
  workouts: WorkoutListItem[];
};

export function WorkoutHistoryList({ workouts }: WorkoutHistoryListProps) {
  if (workouts.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No workouts yet. Start your first session.
      </p>
    );
  }

  const byDate = new Map<string, WorkoutListItem[]>();
  for (const w of workouts) {
    const list = byDate.get(w.date) ?? [];
    list.push(w);
    byDate.set(w.date, list);
  }

  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <section key={date}>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {formatWorkoutDate(date)}
          </h2>
          <ul className="space-y-2">
            {(byDate.get(date) ?? []).map((workout) => (
              <li key={workout.id}>
                <Link
                  href={`/workouts/${workout.id}`}
                  className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{workout.title}</p>
                    {workout.feeling && (
                      <span className="text-xs capitalize text-muted-foreground">
                        {feelingLabel(workout.feeling)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workout.exerciseCount} exercise
                    {workout.exerciseCount === 1 ? "" : "s"}
                    {workout.setCount > 0 &&
                      ` · ${workout.setCount} set${workout.setCount === 1 ? "" : "s"}`}
                    {workout.duration != null &&
                      ` · ${formatWorkoutDuration(workout.duration)}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
