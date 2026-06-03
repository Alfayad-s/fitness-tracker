"use client";

import { Camera, Check, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MEAL_TYPE_LABELS, type MealType } from "@/types/schemas/nutrition";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";
import { cn } from "@/lib/utils";

type NutritionScanConfirmProps = {
  logDate: string;
  onSaved: (log: import("@/lib/db/queries/nutrition").DailyNutritionLog) => void;
  className?: string;
};

export function NutritionPhotoScan({
  logDate,
  onSaved,
  className,
}: NutritionScanConfirmProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<NutritionScanExtraction | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const reset = () => {
    setExtraction(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleFile = async (file: File) => {
    reset();
    setScanning(true);
    setError(null);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("note", `Log meals and hydration for ${logDate}`);

      const response = await fetch("/api/ai/nutrition-scan", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        extraction?: NutritionScanExtraction;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not analyze photo.");
        return;
      }

      if (data.extraction) {
        setExtraction({ ...data.extraction, logDate });
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setScanning(false);
    }
  };

  const confirmSave = async () => {
    if (!extraction) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/nutrition-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: { ...extraction, logDate } }),
      });

      const data = (await response.json()) as {
        error?: string;
        log?: import("@/lib/db/queries/nutrition").DailyNutritionLog;
      };

      if (!response.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }

      if (data.log) {
        onSaved(data.log);
      }

      reset();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">AI photo log</h2>
          <p className="text-xs text-muted-foreground">
            Snap your meal or drinks — AI lists items for you to confirm
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={scanning}
          onClick={() => inputRef.current?.click()}
        >
          {scanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Camera className="size-4" />
          )}
          {scanning ? "Analyzing…" : "Take photo"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {previewUrl && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <img
            src={previewUrl}
            alt="Meal preview"
            className="max-h-40 w-full object-contain bg-muted/30"
          />
        </div>
      )}

      {extraction && (
        <div className="mt-4 space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Confirm before saving
          </p>

          {extraction.meals.map((meal, i) => (
            <div key={`meal-${i}`} className="text-sm">
              <p className="font-medium">{meal.name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {MEAL_TYPE_LABELS[meal.mealType as MealType]}
                {meal.calories != null && ` · ${Math.round(meal.calories)} kcal`}
                {meal.proteinG != null && ` · ${meal.proteinG}g protein`}
              </p>
              {meal.ingredients?.length ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {meal.ingredients.join(", ")}
                </p>
              ) : null}
            </div>
          ))}

          {extraction.water.map((w, i) => (
            <div key={`water-${i}`} className="text-sm">
              <p className="font-medium">
                {w.amountMl} ml
                {w.label ? ` — ${w.label}` : ""}
              </p>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={reset}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={saving}
              onClick={confirmSave}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Confirm & save
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
