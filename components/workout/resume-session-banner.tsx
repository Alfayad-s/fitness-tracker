"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  getWorkoutSessionStatus,
  isWorkoutSessionInProgress,
} from "@/types/workout-session";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";

export function ResumeSessionBanner() {
  const session = useWorkoutSessionStore((s) => s.session);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || !session) return null;

  const status = getWorkoutSessionStatus(session);
  if (!isWorkoutSessionInProgress(status)) return null;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium">Workout in progress</p>
      <p className="mt-0.5 truncate text-sm text-muted-foreground">
        {session.title}
        {status === "paused" ? " · paused" : ""}
      </p>
      <Button asChild className="mt-3 w-full">
        <Link href="/workouts/active">Resume workout</Link>
      </Button>
    </div>
  );
}
