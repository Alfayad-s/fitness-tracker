import { Skeleton } from "@/components/ui/skeleton";

type RoutePageSkeletonProps = {
  title?: string;
  rows?: number;
};

export function RoutePageSkeleton({
  title = "Loading…",
  rows = 4,
}: RoutePageSkeletonProps) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6">
      <header className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </header>
      <span className="sr-only">{title}</span>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </main>
  );
}
