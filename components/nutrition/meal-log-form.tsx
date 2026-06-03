"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useNutritionLog } from "@/components/nutrition/nutrition-log-provider";
import { Button } from "@/components/ui/button";
import { addMealToLog, replaceMealInLog } from "@/lib/nutrition/merge-daily-log";
import { Input } from "@/components/ui/input";
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  type MealEntryFormValues,
  type MealType,
} from "@/types/schemas/nutrition";
import { createMealEntry } from "@/services/nutrition-actions";
import type { MealEntry } from "@/types";

type MealLogFormProps = {
  logDate: string;
};

export function MealLogForm({ logDate }: MealLogFormProps) {
  const { log, setLog } = useNutritionLog();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<MealEntryFormValues>({
    defaultValues: {
      logDate,
      mealType: "lunch",
      name: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const tempId = `pending-meal-${crypto.randomUUID()}`;
    const previous = log;
    const now = new Date();
    const optimistic: MealEntry = {
      id: tempId,
      userId: "",
      logDate,
      mealType: values.mealType,
      name: values.name,
      calories:
        values.calories != null ? Math.round(Number(values.calories)) : null,
      proteinG: values.proteinG != null ? String(values.proteinG) : null,
      carbsG: values.carbsG != null ? String(values.carbsG) : null,
      fatG: values.fatG != null ? String(values.fatG) : null,
      notes: values.notes ?? null,
      loggedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    setLog(addMealToLog(log, optimistic));
    setOpen(false);

    const result = await createMealEntry({ ...values, logDate });
    if ("error" in result) {
      setLog(previous);
      setError(result.error);
      setOpen(true);
      return;
    }

    setLog((prev) => replaceMealInLog(prev, tempId, result.meal));
    reset({ logDate, mealType: "lunch", name: "" });
  });

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Log a meal
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-xl border border-border bg-muted/20 p-4"
    >
      <input type="hidden" {...register("logDate")} value={logDate} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label htmlFor="meal-name" className="text-sm font-medium">
            Meal name
          </label>
          <Input
            id="meal-name"
            placeholder="Chicken rice bowl"
            {...register("name", { required: true })}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="meal-type" className="text-sm font-medium">
            Type
          </label>
          <select
            id="meal-type"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            {...register("mealType")}
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {MEAL_TYPE_LABELS[t as MealType]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="meal-calories" className="text-sm font-medium">
            Calories
          </label>
          <Input
            id="meal-calories"
            type="number"
            min={0}
            placeholder="520"
            {...register("calories")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="meal-protein" className="text-sm font-medium">
            Protein (g)
          </label>
          <Input
            id="meal-protein"
            type="number"
            min={0}
            step="0.1"
            placeholder="42"
            {...register("proteinG")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="meal-carbs" className="text-sm font-medium">
            Carbs (g)
          </label>
          <Input
            id="meal-carbs"
            type="number"
            min={0}
            step="0.1"
            {...register("carbsG")}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="meal-fat" className="text-sm font-medium">
            Fat (g)
          </label>
          <Input
            id="meal-fat"
            type="number"
            min={0}
            step="0.1"
            {...register("fatG")}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          className="flex-1"
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Save meal"
          )}
        </Button>
      </div>
    </form>
  );
}
