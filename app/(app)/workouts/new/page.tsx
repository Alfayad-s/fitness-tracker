import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { StartWorkoutForm } from "@/components/workout/start-workout-form";
import {
  ensureDailyWorkoutPlan,
  fetchDailyWorkoutPlan,
} from "@/services/daily-plan-actions";
import {
  fetchWorkoutTemplates,
  fetchWorkoutTemplate,
} from "@/services/workout-template-actions";
import { todayDateString } from "@/lib/workout/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "New workout",
};

type PageProps = {
  searchParams: Promise<{ planDate?: string; from?: string }>;
};

export default async function NewWorkoutPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const requestedDate = params.planDate?.trim();
  const today = todayDateString();

  const planResult = requestedDate
    ? await fetchDailyWorkoutPlan(requestedDate)
    : await ensureDailyWorkoutPlan(today);

  const [{ templates }] = await Promise.all([fetchWorkoutTemplates()]);

  const dailyPlan = planResult.plan ?? null;
  const templateIds = new Set<string>();
  for (const t of templates) templateIds.add(t.id);
  if (dailyPlan?.templateId) templateIds.add(dailyPlan.templateId);

  const templateDetails: Record<
    string,
    Awaited<ReturnType<typeof fetchWorkoutTemplate>>["template"]
  > = {};
  await Promise.all(
    [...templateIds].map(async (id) => {
      const result = await fetchWorkoutTemplate(id);
      if (result.template) templateDetails[id] = result.template;
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          New workout
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start empty, from a template, or a saved plan.
        </p>
      </header>

      <Suspense fallback={null}>
        <StartWorkoutForm
          userId={user.id}
          templates={[...templates]}
          templateDetails={templateDetails as never}
          dailyPlan={dailyPlan}
        />
      </Suspense>
    </main>
  );
}
