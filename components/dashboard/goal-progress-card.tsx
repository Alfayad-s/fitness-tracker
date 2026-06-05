import Link from "next/link";

import type { DashboardGoal } from "@/types/dashboard";
import type { goalTypeValues } from "@/types/schemas/profile";

const GOAL_HINTS: Record<(typeof goalTypeValues)[number], string> = {
  lose_weight: "Track weight on Progress and keep training consistent.",
  gain_muscle: "Progressive overload and regular sessions build muscle.",
  maintain: "Stay consistent — small wins add up week over week.",
  strength: "Log heavy sets and watch your lifts climb on Progress.",
  endurance: "Mix conditioning with recovery days for steady gains.",
  general_fitness: "Balance strength, cardio, and recovery for overall health.",
};

type GoalProgressCardProps = {
  goal: DashboardGoal;
};

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
  return (
    <section className="rounded-xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Your goal
          </p>
          <h2 className="mt-1 text-base font-semibold">{goal.label}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {GOAL_HINTS[goal.type]}
          </p>
        </div>
        <Link
          href="/profile"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Edit
        </Link>
      </div>
    </section>
  );
}
