import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StartWorkoutForm } from "@/components/workout/start-workout-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New workout",
};

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          New workout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a title and date, then start logging.
        </p>
      </header>

      <StartWorkoutForm userId={user.id} />
    </main>
  );
}
