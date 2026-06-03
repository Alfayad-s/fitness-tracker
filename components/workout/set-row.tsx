"use client";

import { Copy, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ClientId, SessionSet } from "@/types";
import { useOptionalWorkoutEditor } from "@/components/workout/workout-editor-context";
import { useWorkoutSessionStore } from "@/stores/workout-session-store";

type SetRowProps = {
  exerciseId: ClientId;
  set: SessionSet;
  index: number;
  disabled?: boolean;
};

export function SetRow({ exerciseId, set, index, disabled: disabledProp }: SetRowProps) {
  const editor = useOptionalWorkoutEditor();
  const updateSetStore = useWorkoutSessionStore((s) => s.updateSet);
  const removeSetStore = useWorkoutSessionStore((s) => s.removeSet);
  const duplicateSetStore = useWorkoutSessionStore((s) => s.duplicateSet);
  const startRestTimer = useWorkoutSessionStore((s) => s.startRestTimer);

  const updateSet = editor?.updateSet ?? updateSetStore;
  const removeSet = editor?.removeSet ?? removeSetStore;
  const duplicateSet = editor?.duplicateSet ?? duplicateSetStore;
  const disabled = disabledProp ?? editor?.disabled;

  const parseNum = (value: string): number | null => {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const onBlurStartRest = () => {
    if (disabled) return;
    const seconds = set.restSeconds ?? 90;
    startRestTimer(seconds, { exerciseId, setId: set.id });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_1fr_auto] items-center gap-2",
        set.isWarmup && "opacity-80",
      )}
    >
      <span className="text-center text-xs font-medium text-muted-foreground">
        {index + 1}
      </span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.5"
        placeholder="kg"
        disabled={disabled}
        className="h-9 px-2 text-center"
        value={set.weightKg ?? ""}
        onChange={(e) =>
          updateSet(exerciseId, set.id, {
            weightKg: parseNum(e.target.value),
          })
        }
        aria-label={`Set ${index + 1} weight kg`}
      />
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder="reps"
        disabled={disabled}
        className="h-9 px-2 text-center"
        value={set.reps ?? ""}
        onChange={(e) =>
          updateSet(exerciseId, set.id, {
            reps: parseNum(e.target.value),
          })
        }
        onBlur={onBlurStartRest}
        aria-label={`Set ${index + 1} reps`}
      />
      <Input
        type="number"
        inputMode="numeric"
        min={1}
        max={10}
        step={1}
        placeholder="RPE"
        disabled={disabled}
        className="h-9 px-2 text-center"
        value={set.rpe ?? ""}
        onChange={(e) => {
          const n = parseNum(e.target.value);
          if (n != null && (n < 1 || n > 10)) return;
          updateSet(exerciseId, set.id, { rpe: n });
        }}
        aria-label={`Set ${index + 1} RPE`}
      />
      <div className="flex gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => duplicateSet(exerciseId, set.id)}
          aria-label="Duplicate set"
        >
          <Copy className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          onClick={() => removeSet(exerciseId, set.id)}
          aria-label="Remove set"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
