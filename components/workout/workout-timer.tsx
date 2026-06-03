"use client";

import { useEffect, useState } from "react";

import { formatWorkoutDuration } from "@/lib/workout/format";
import {
  getActiveWorkoutElapsedMs,
  useWorkoutSessionStore,
} from "@/stores/workout-session-store";

export function WorkoutTimer() {
  const session = useWorkoutSessionStore((s) => s.session);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session || session.status === "completed") return;

    const tick = () => {
      setElapsed(Math.floor(getActiveWorkoutElapsedMs(session) / 1000));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  if (!session) return null;

  return (
    <span className="font-mono text-sm tabular-nums text-muted-foreground">
      {formatWorkoutDuration(elapsed)}
    </span>
  );
}
