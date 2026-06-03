import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProgressDashboard } from "@/components/analytics/progress-dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Progress",
};

export default async function ProgressPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Training volume, body trends, and exercise progress.
        </p>
        <Link
          href="/nutrition"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Meals & hydration tracking →
        </Link>
      </header>

      <ProgressDashboard />
    </main>
  );
}
