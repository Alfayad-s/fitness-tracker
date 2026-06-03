import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-skeletons";

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 md:max-w-3xl">
      <DashboardPageSkeleton />
    </main>
  );
}
