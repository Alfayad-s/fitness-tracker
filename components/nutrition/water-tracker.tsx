"use client";

import { Droplets, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { useNutritionLog } from "@/components/nutrition/nutrition-log-provider";
import { Button } from "@/components/ui/button";
import { WATER_BOTTLE_ML } from "@/lib/measurements/daily-nutrition-targets";
import {
  addWaterToLog,
  createOptimisticWaterEntry,
  removeWaterFromLog,
  replaceWaterInLog,
} from "@/lib/nutrition/merge-daily-log";
import { addWaterEntry, deleteWaterEntry } from "@/services/nutrition-actions";

const QUICK_AMOUNTS = [
  { label: "+250 ml", ml: 250 },
  { label: "+500 ml", ml: 500 },
  { label: `+1 bottle`, ml: WATER_BOTTLE_ML },
] as const;

type WaterTrackerProps = {
  logDate: string;
};

export function WaterTracker({ logDate }: WaterTrackerProps) {
  const { log, targets, setLog } = useNutritionLog();
  const { waterEntries, totals } = log;
  const targetMl = targets.waterMl;

  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addWater = async (amountMl: number, label: string) => {
    setError(null);
    const tempId = `pending-water-${crypto.randomUUID()}`;
    const previous = log;
    const optimistic = createOptimisticWaterEntry(logDate, amountMl, tempId);

    setLog(addWaterToLog(log, optimistic));
    setLoadingLabel(label);

    const result = await addWaterEntry({ logDate, amountMl });
    setLoadingLabel(null);

    if ("error" in result) {
      setLog(previous);
      setError(result.error);
      return;
    }

    setLog((prev) => replaceWaterInLog(prev, tempId, result.entry));
  };

  const remove = async (id: string) => {
    setError(null);
    const previous = log;
    setLog(removeWaterFromLog(log, id));
    setDeletingId(id);

    const result = await deleteWaterEntry(id);
    setDeletingId(null);

    if ("error" in result) {
      setLog(previous);
      setError(result.error);
    }
  };

  const percent =
    targetMl > 0 ? Math.min(100, Math.round((totals.waterMl / targetMl) * 100)) : 0;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400">
          <Droplets className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Hydration</h2>
          <p className="text-xs text-muted-foreground">
            {totals.waterMl.toLocaleString()} / {targetMl.toLocaleString()} ml (
            {percent}%)
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((item) => (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            size="sm"
            disabled={loadingLabel !== null}
            onClick={() => addWater(item.ml, item.label)}
          >
            {loadingLabel === item.label ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              item.label
            )}
          </Button>
        ))}
      </div>

      {waterEntries.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {waterEntries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-sm"
            >
              <span className="tabular-nums">{entry.amountMl} ml</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Remove water log"
                disabled={deletingId === entry.id}
                onClick={() => remove(entry.id)}
              >
                {deletingId === entry.id ? (
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
