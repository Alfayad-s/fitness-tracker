import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CustomExercisesList } from "@/components/workout/custom-exercises-list";
import { InstallGrowthPresetsButton } from "@/components/workout/install-growth-presets-button";
import { WorkoutTemplatesList } from "@/components/workout/workout-templates-list";
import { Button } from "@/components/ui/button";
import { fetchWorkoutTemplates } from "@/services/workout-template-actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workout templates",
};

export default async function WorkoutTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { templates, error } = await fetchWorkoutTemplates();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reusable workout presets for quick starts.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/workouts/programs">Programs</Link>
        </Button>
      </header>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <InstallGrowthPresetsButton />

      <WorkoutTemplatesList templates={[...templates]} />

      <CustomExercisesList />

      <p className="text-sm text-muted-foreground">
        Save templates from a completed workout, or ask the AI coach to build
        today&apos;s plan.
      </p>
    </main>
  );
}
