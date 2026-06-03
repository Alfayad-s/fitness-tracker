"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FEELING_OPTIONS } from "@/lib/workout/format";
import { completeWorkoutWithOfflineSupport } from "@/lib/workout/complete-workout-client";
import { cn } from "@/lib/utils";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";
import type { Feeling } from "@/types";

type CompleteWorkoutSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CompleteWorkoutSheet({
  open,
  onOpenChange,
}: CompleteWorkoutSheetProps) {
  const router = useRouter();
  const session = useWorkoutSessionStore((s) => s.session);
  const completeWorkout = useWorkoutSessionStore((s) => s.completeWorkout);
  const clearSession = useWorkoutSessionStore((s) => s.clearSession);

  const [feeling, setFeeling] = useState<Feeling | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!session) return;
    setSaving(true);
    setError(null);

    const result = await completeWorkoutWithOfflineSupport(session, feeling);

    if (result.status === "error") {
      setSaving(false);
      setError(result.error);
      return;
    }

    completeWorkout({ feeling });
    clearSession();
    onOpenChange(false);
    setSaving(false);

    if (result.status === "queued") {
      router.push("/workouts");
      router.refresh();
      return;
    }

    router.push(`/workouts/${result.workoutId}`);
    router.refresh();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-2xl border border-border bg-background p-6 shadow-xl outline-none">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Finish workout
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close">
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            How did this session feel?
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {FEELING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFeeling(opt.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs transition-colors",
                  feeling === opt.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted",
                )}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="button"
            className="mt-6 h-12 w-full text-base"
            disabled={saving || !session || session.exercises.length === 0}
            onClick={handleFinish}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save workout"
            )}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
