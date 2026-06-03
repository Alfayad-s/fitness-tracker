import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { WorkoutSyncProvider } from "@/components/workout/workout-sync-provider";
import { getAppHeaderData } from "@/lib/layout/get-app-header-data";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerData = await getAppHeaderData();
  const showHomeStreakPin = headerData.currentStreak >= 1;

  return (
    <AppShell
      showHomeStreakPin={showHomeStreakPin}
      header={<AppHeader data={headerData} />}
    >
      <WorkoutSyncProvider />
      <InstallPrompt />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </AppShell>
  );
}
