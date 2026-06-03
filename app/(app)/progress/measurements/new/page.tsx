import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MeasurementForm } from "@/components/analytics/measurement-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Log measurement",
};

export default async function NewMeasurementPage() {
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
          Log measurement
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Weight, body fat, protein, bone mass, body water, muscle mass, and
          optional circumferences.
        </p>
      </header>

      <MeasurementForm />
    </main>
  );
}
