"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getQueuedWorkoutSaveCount } from "@/lib/offline/workout-save-queue";
import { flushWorkoutSaveQueue } from "@/lib/offline/flush-workout-save-queue";

export function WorkoutSyncProvider() {
  const router = useRouter();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshPending = useCallback(() => {
    setPending(getQueuedWorkoutSaveCount());
  }, []);

  const syncQueue = useCallback(async () => {
    if (getQueuedWorkoutSaveCount() === 0) return;

    setSyncing(true);
    setMessage(null);

    const result = await flushWorkoutSaveQueue();
    refreshPending();
    setSyncing(false);

    if (result.synced > 0) {
      setMessage(
        result.synced === 1
          ? "Workout synced successfully."
          : `${result.synced} workouts synced.`,
      );
      router.refresh();
      window.setTimeout(() => setMessage(null), 4000);
    } else if (result.failed > 0) {
      setMessage("Some workouts could not sync. Will retry when online.");
    }
  }, [refreshPending, router]);

  useEffect(() => {
    refreshPending();

    const onOnline = () => {
      refreshPending();
      void syncQueue();
    };

    window.addEventListener("online", onOnline);
    void syncQueue();

    return () => window.removeEventListener("online", onOnline);
  }, [refreshPending, syncQueue]);

  if (pending === 0 && !message) return null;

  return (
    <div
      className="fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-50 mx-auto max-w-lg px-4 md:top-4 md:max-w-none md:pl-[calc(14rem+1rem)] md:pr-6"
      role="status"
    >
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-foreground shadow-sm">
        {syncing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Syncing {pending} workout{pending === 1 ? "" : "s"}…
          </span>
        ) : message ? (
          <span>{message}</span>
        ) : (
          <span>
            {pending} workout{pending === 1 ? "" : "s"} waiting to sync when
            online.
          </span>
        )}
      </div>
    </div>
  );
}
