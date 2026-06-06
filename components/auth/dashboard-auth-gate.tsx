"use client";

import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-skeletons";
import { useRequireAuth } from "@/hooks/use-require-auth";

type DashboardAuthGateProps = {
  children: React.ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const status = useRequireAuth("/dashboard");

  if (status !== "authenticated") {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:max-w-3xl">
        <DashboardPageSkeleton />
      </main>
    );
  }

  return children;
}
