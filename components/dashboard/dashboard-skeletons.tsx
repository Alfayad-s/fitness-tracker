import { Skeleton } from "@/components/ui/skeleton";

export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-9 w-44" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-36 w-28 shrink-0 rounded-lg sm:h-44" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-52 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}

export function DashboardFrequencyChartSkeleton() {
  return (
    <section className="rounded-xl bg-card p-4">
      <div className="mb-3 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </section>
  );
}

export function DashboardRecentSectionSkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="flex items-end justify-between gap-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardOverviewSkeleton />
      <DashboardFrequencyChartSkeleton />
      <DashboardRecentSectionSkeleton />
    </div>
  );
}
