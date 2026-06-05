import { Suspense } from "react";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppHeaderSkeleton } from "@/components/layout/app-header-skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { WorkoutSyncProvider } from "@/components/workout/workout-sync-provider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell
      header={
        <Suspense fallback={<AppHeaderSkeleton />}>
          <AppHeader />
        </Suspense>
      }
    >
      <WorkoutSyncProvider />
      <InstallPrompt />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </AppShell>
  );
}
