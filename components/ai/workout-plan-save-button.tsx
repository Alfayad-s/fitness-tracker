"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatPlanDateLabel } from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import type { WorkoutPlanPatch } from "@/types/schemas/daily-plan";

type WorkoutPlanSaveButtonProps = {
  patch: WorkoutPlanPatch;
  saved?: boolean;
  onSaved: (savedContent: string) => void;
};

export function WorkoutPlanSaveButton({
  patch,
  saved = false,
  onSaved,
}: WorkoutPlanSaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (saved) {
    return (
      <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <Check className="size-4 shrink-0" />
        Plan updated
      </p>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/workout-plan-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not save. Try again.");
        return;
      }

      if (data.message) {
        onSaved(data.message);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = formatPlanDateLabel(patch.planDate, todayDateString());

  return (
    <div className="mt-3 border-t border-neutral-200 pt-3">
      <Button
        type="button"
        className="h-10 w-full rounded-xl text-sm font-semibold"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          `Save plan for ${dateLabel.toLowerCase()}`
        )}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
