import type { Metadata } from "next";
import Link from "next/link";

import { DbUnavailableAlert } from "@/components/db/db-unavailable-alert";
import { ResumeSessionBanner } from "@/components/workout/resume-session-banner";
import { WeeklyWorkoutPlanner } from "@/components/workout/weekly-workout-planner";
import { WorkoutHistoryList } from "@/components/workout/workout-history-list";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth/require-page-user";
import { listWorkoutsByUser } from "@/lib/db/queries/workouts";
import { fetchWeekSchedule } from "@/services/daily-plan-actions";
import { fetchWorkoutTemplates } from "@/services/workout-template-actions";

export const metadata: Metadata = {
  title: "Workouts",
};

export default async function WorkoutsPage() {
  const user = await requirePageUser();
  const [{ workouts, dbUnavailable }, weekSchedule, templatesResult] =
    await Promise.all([
      listWorkoutsByUser(user.id),
      fetchWeekSchedule(),
      fetchWorkoutTemplates(),
    ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      {dbUnavailable ? <DbUnavailableAlert /> : null}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workouts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Log and review your training sessions.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/workouts/templates">Templates</Link>
        </Button>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/workouts/new">New</Link>
        </Button>
      </header>

      <ResumeSessionBanner />

      <WeeklyWorkoutPlanner
        initialWeekStart={weekSchedule.weekStart}
        initialDays={weekSchedule.days}
        templates={[...(templatesResult.templates ?? [])]}
      />

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          History
        </h2>
        <WorkoutHistoryList workouts={workouts} />
      </section>
    </main>
  );
}
