"use client";

import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/lib/analytics/date-range";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "custom", label: "Custom" },
];

type DateRangeFilterProps = {
  preset: DateRangePreset;
  customFrom: string;
  customTo: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
};

export function DateRangeFilter({
  preset,
  customFrom,
  customTo,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
}: DateRangeFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {PRESETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onPresetChange(value)}
            className={cn(
              "min-h-9 flex-1 rounded-lg border px-2 text-sm font-medium transition-colors",
              preset === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="range-from" className="text-xs text-muted-foreground">
              From
            </label>
            <input
              id="range-from"
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="range-to" className="text-xs text-muted-foreground">
              To
            </label>
            <input
              id="range-to"
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
