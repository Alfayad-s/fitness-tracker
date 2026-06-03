"use client";

import { Loader2, Trash2, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

import { useNutritionLog } from "@/components/nutrition/nutrition-log-provider";
import { Button } from "@/components/ui/button";
import { removeMealFromLog } from "@/lib/nutrition/merge-daily-log";
import { MEAL_TYPE_LABELS, type MealType } from "@/types/schemas/nutrition";
import { deleteMealEntry } from "@/services/nutrition-actions";
import type { MealEntry } from "@/types";

function formatMacros(meal: MealEntry): string {
  const parts: string[] = [];
  if (meal.calories != null) parts.push(`${meal.calories} kcal`);
  if (meal.proteinG != null && meal.proteinG !== "")
    parts.push(`${meal.proteinG}g protein`);
  return parts.join(" · ");
}

export function MealList() {
  const { log, setLog } = useNutritionLog();
  const meals = log.meals;
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = async (id: string) => {
    setError(null);
    const previous = log;
    setLog(removeMealFromLog(log, id));
    setDeletingId(id);

    const result = await deleteMealEntry(id);
    setDeletingId(null);

    if ("error" in result) {
      setLog(previous);
      setError(result.error);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-500">
          <UtensilsCrossed className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">Meals today</h2>
      </div>

      {meals.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No meals logged yet. Add breakfast, lunch, dinner, or snacks below.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {meals.map((meal) => (
            <li
              key={meal.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-medium">{meal.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {MEAL_TYPE_LABELS[meal.mealType as MealType]}
                </p>
                {formatMacros(meal) && (
                  <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                    {formatMacros(meal)}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Delete ${meal.name}`}
                disabled={deletingId === meal.id}
                onClick={() => remove(meal.id)}
              >
                {deletingId === meal.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5 text-muted-foreground" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
