"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatStoredMeasurementLines } from "@/lib/ai/bma-to-measurement";
import { deleteBodyMeasurement } from "@/services/measurement-actions";
import type { BodyMeasurement } from "@/types";

type MeasurementsHistoryProps = {
  measurements: BodyMeasurement[];
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MeasurementsHistory({ measurements }: MeasurementsHistoryProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (measurements.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No measurements yet. Log your first entry below.
      </p>
    );
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this measurement?")) return;
    setDeletingId(id);
    await deleteBodyMeasurement(id);
    setDeletingId(null);
    router.refresh();
  };

  return (
    <ul className="space-y-2">
      {measurements.map((m) => {
        const detailLines = formatStoredMeasurementLines(m);

        return (
          <li
            key={m.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="min-w-0 text-sm">
              <p className="font-medium">{formatDate(m.recordedAt)}</p>
              {detailLines.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {detailLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">No metrics recorded</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-touch"
              disabled={deletingId === m.id}
              onClick={() => handleDelete(m.id)}
              aria-label="Delete measurement"
            >
              {deletingId === m.id ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
