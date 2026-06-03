import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { NutritionTracker } from "@/components/nutrition/nutrition-tracker";
import { getDailyNutritionLog } from "@/lib/db/queries/nutrition";
import { listBodyMeasurementsByUser } from "@/lib/db/queries/body-measurements";
import { calculateDailyNutritionTargets } from "@/lib/measurements/daily-nutrition-targets";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { todayDateString } from "@/lib/workout/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Meals & hydration",
};

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

function parseLogDate(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return todayDateString();
}

export default async function NutritionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const logDate = parseLogDate(params.date);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, { measurements }, log] = await Promise.all([
    getUserProfile(user),
    listBodyMeasurementsByUser(user.id, 1),
    getDailyNutritionLog(user.id, logDate),
  ]);

  const latestMeasurement = measurements[0] ?? null;
  const targets = calculateDailyNutritionTargets({
    profile,
    measurement: latestMeasurement,
  });

  if (!targets) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:max-w-3xl">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Meals & hydration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track daily meals and water intake against your body goals.
          </p>
        </header>

        <section className="rounded-xl border border-dashed border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Log your weight on Progress (or upload a BMA scan in AI) to unlock
            daily calorie, protein, and water targets.
          </p>
          <Link
            href="/progress/measurements/new"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Log weight →
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Meals & hydration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Log meals and water for the day. Progress bars compare to your daily
          targets from body composition.
        </p>
      </header>

      <NutritionTracker
        initialLogDate={logDate}
        log={log}
        targets={targets}
      />
    </main>
  );
}
