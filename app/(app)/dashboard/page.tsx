import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DashboardFrequencySection } from "@/components/dashboard/dashboard-frequency-section";
import { DashboardOverviewSection } from "@/components/dashboard/dashboard-overview-section";
import { DashboardRecentSection } from "@/components/dashboard/dashboard-recent-section";
import {
  DashboardFrequencyChartSkeleton,
  DashboardOverviewSkeleton,
  DashboardRecentSectionSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:max-w-3xl">
      <Suspense fallback={<DashboardOverviewSkeleton />}>
        <DashboardOverviewSection user={user} />
      </Suspense>

      <Suspense fallback={<DashboardFrequencyChartSkeleton />}>
        <DashboardFrequencySection userId={user.id} />
      </Suspense>

      <Suspense fallback={<DashboardRecentSectionSkeleton />}>
        <DashboardRecentSection userId={user.id} />
      </Suspense>
    </main>
  );
}
