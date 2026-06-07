import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkoutProgramsView } from "@/components/workout/workout-programs-view";
import { fetchActiveWorkoutProgram, fetchWorkoutPrograms } from "@/services/workout-program-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workout programs",
};

export default async function WorkoutProgramsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ programs }, { program: active }] = await Promise.all([
    fetchWorkoutPrograms(),
    fetchActiveWorkoutProgram(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <Link
          href="/workouts/templates"
          className="text-sm text-muted-foreground underline"
        >
          ← Templates
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Weekly programs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Map training days to templates for automatic daily plans.
        </p>
      </header>

      <WorkoutProgramsView
        programs={[...programs]}
        activeProgramId={active?.id ?? null}
      />
    </main>
  );
}
