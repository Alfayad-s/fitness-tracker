import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardFrequencySection } from "@/components/dashboard/dashboard-frequency-section";
import { DashboardOverviewSection } from "@/components/dashboard/dashboard-overview-section";
import { DashboardRecentSection } from "@/components/dashboard/dashboard-recent-section";
import {
  DashboardFrequencyChartSkeleton,
  DashboardOverviewSkeleton,
  DashboardRecentSectionSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { requirePageUser } from "@/lib/auth/require-page-user";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requirePageUser("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 pb-6 pt-0 md:max-w-3xl md:py-6">
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
