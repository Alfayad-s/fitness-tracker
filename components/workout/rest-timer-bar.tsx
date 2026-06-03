"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getRestTimerRemainingSeconds,
  useWorkoutSessionStore,
} from "@/stores/workout-session-store";

export function RestTimerBar() {
  const restTimer = useWorkoutSessionStore((s) => s.session?.restTimer);
  const cancelRestTimer = useWorkoutSessionStore((s) => s.cancelRestTimer);
  const completeRestTimer = useWorkoutSessionStore((s) => s.completeRestTimer);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimer || restTimer.status !== "running") return;

    const tick = () => {
      const secs = getRestTimerRemainingSeconds(restTimer);
      setRemaining(secs);
      if (secs <= 0) {
        completeRestTimer();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [restTimer, completeRestTimer]);

  if (!restTimer || restTimer.status !== "running") return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg px-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary px-4 py-3 text-primary-foreground shadow-lg">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            Rest
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums">
            {remaining}s
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="shrink-0"
          onClick={cancelRestTimer}
          aria-label="Cancel rest timer"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
