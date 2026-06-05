import { Skeleton } from "@/components/ui/skeleton";

export function AppHeaderSkeleton() {
  return (
    <div
      className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
      aria-hidden
    >
      <div className="mx-auto flex h-[4.75rem] max-w-lg items-center justify-between gap-4 px-4 py-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="size-10 rounded-full" />
      </div>
    </div>
  );
}
