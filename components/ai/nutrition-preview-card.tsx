"use client";

import { Droplets, UtensilsCrossed } from "lucide-react";

import { MEAL_TYPE_LABELS, type MealType } from "@/types/schemas/nutrition";
import { cn } from "@/lib/utils";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";

type NutritionPreviewCardProps = {
  extraction: NutritionScanExtraction;
  className?: string;
};

export function NutritionPreviewCard({
  extraction,
  className,
}: NutritionPreviewCardProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {extraction.summary?.trim() ? (
        <p className="text-sm leading-relaxed text-neutral-700">
          {extraction.summary.trim()}
        </p>
      ) : null}

      {extraction.meals.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5">
            <UtensilsCrossed className="size-4 text-neutral-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Meals detected
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {extraction.meals.map((meal, index) => {
              const type = MEAL_TYPE_LABELS[meal.mealType as MealType];
              const macros: string[] = [];
              if (meal.calories != null) macros.push(`${Math.round(meal.calories)} kcal`);
              if (meal.proteinG != null) macros.push(`${meal.proteinG}g protein`);
              return (
                <li key={`${meal.name}-${index}`} className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{meal.name}</p>
                  <p className="text-xs text-neutral-500">{type}</p>
                  {macros.length > 0 ? (
                    <p className="mt-1 text-sm text-neutral-600">
                      {macros.join(" · ")}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {extraction.water.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-neutral-100 bg-neutral-50/80 px-4 py-2.5">
            <Droplets className="size-4 text-neutral-500" />
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Hydration
            </p>
          </div>
          <ul className="divide-y divide-neutral-100">
            {extraction.water.map((w, index) => (
              <li key={index} className="px-4 py-3 text-sm text-neutral-800">
                {w.amountMl} ml{w.label?.trim() ? ` · ${w.label}` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-neutral-500">
        Review the items above, then confirm to add them to today&apos;s log.
      </p>
    </div>
  );
}
