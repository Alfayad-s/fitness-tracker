"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  activatePresetProgramAction,
  activateWorkoutProgramAction,
  deleteWorkoutProgramAction,
} from "@/services/workout-program-actions";
import { PRESET_PROGRAMS } from "@/lib/workout/preset-programs";
import type {
  WorkoutProgramSummary,
} from "@/types/schemas/workout-program";

type WorkoutProgramsViewProps = {
  programs: WorkoutProgramSummary[];
  activeProgramId: string | null;
};

export function WorkoutProgramsView({
  programs,
  activeProgramId,
}: WorkoutProgramsViewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (programId: string) => {
    setBusy(programId);
    setError(null);
    const result = await activateWorkoutProgramAction(programId);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handlePreset = async (presetId: string) => {
    setBusy(presetId);
    setError(null);
    const result = await activatePresetProgramAction(presetId);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handleDelete = async (programId: string, name: string) => {
    if (!window.confirm(`Delete program "${name}"?`)) return;
    setBusy(programId);
    setError(null);
    const result = await deleteWorkoutProgramAction(programId);
    setBusy(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Preset splits
        </h2>
        <p className="text-sm text-muted-foreground">
          Activates a weekly schedule and creates matching workout templates
          automatically when available.
        </p>
        <ul className="space-y-2">
          {PRESET_PROGRAMS.map((preset) => (
            <li
              key={preset.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{preset.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy != null}
                  onClick={() => handlePreset(preset.id)}
                >
                  {busy === preset.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Activate"
                  )}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Your programs
        </h2>
        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom programs yet. Activate a preset above to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {programs.map((program) => (
              <li
                key={program.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div>
                  <p className="font-semibold">
                    {program.name}
                    {program.isActive ? (
                      <span className="ml-2 text-xs font-normal text-emerald-600">
                        Active
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {program.dayCount} days · {program.source}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!program.isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy != null}
                      onClick={() => handleActivate(program.id)}
                    >
                      {busy === program.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Activate"
                      )}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy != null || program.isActive}
                    onClick={() => handleDelete(program.id, program.name)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
