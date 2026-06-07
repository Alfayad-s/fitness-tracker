"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { saveWorkoutAsTemplateAction } from "@/services/workout-template-actions";

type SaveAsTemplateButtonProps = {
  workoutId: string;
  defaultName?: string;
};

export function SaveAsTemplateButton({
  workoutId,
  defaultName,
}: SaveAsTemplateButtonProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const name = window.prompt(
      "Template name",
      defaultName ?? "My workout",
    );
    if (!name?.trim()) return;

    setSaving(true);
    setError(null);
    const result = await saveWorkoutAsTemplateAction(workoutId, name.trim());
    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  };

  if (saved) {
    return (
      <p className="text-sm text-emerald-700">
        Saved as template. View in{" "}
        <a href="/workouts/templates" className="underline">
          My templates
        </a>
        .
      </p>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Bookmark className="size-4" />
            Save as template
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
