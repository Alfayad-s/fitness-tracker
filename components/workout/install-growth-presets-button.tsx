"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { installGrowthPresetTemplatesAction } from "@/services/workout-program-actions";

export function InstallGrowthPresetsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async () => {
    setBusy(true);
    setError(null);
    const result = await installGrowthPresetTemplatesAction();
    setBusy(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-dashed border-border p-4">
      <p className="text-sm font-medium">PPL Growth preset pack</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Install Push A/B, Pull A/B, Legs A/B, Abs, and Forearms templates with
        sets and reps pre-filled.
      </p>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={busy}
        onClick={() => void handleInstall()}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            <Sparkles className="size-4" />
            Install templates
          </>
        )}
      </Button>
    </div>
  );
}
