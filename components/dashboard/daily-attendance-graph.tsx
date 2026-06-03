"use client";

import { useEffect, useMemo, useState } from "react";

import { ContributionGraph } from "@/components/ui/contribution-graph";
import {
  formatAttendanceWindowLabel,
  generateSampleAttendanceData,
} from "@/lib/attendance";

const MONTHS_SHOWN = 3;

type DailyAttendanceGraphProps = {
  className?: string;
};

export function DailyAttendanceGraph({ className }: DailyAttendanceGraphProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const attendanceData = useMemo(
    () => (mounted ? generateSampleAttendanceData(MONTHS_SHOWN) : []),
    [mounted],
  );

  const periodLabel = useMemo(
    () => (mounted ? formatAttendanceWindowLabel(MONTHS_SHOWN) : ""),
    [mounted],
  );

  if (!mounted) {
    return (
      <section className={className} aria-busy="true" aria-label="Loading attendance">
        <div className="mb-3 h-4 w-44 max-w-full animate-pulse rounded bg-muted" />
        <div className="h-44 animate-pulse rounded-lg bg-muted/80" />
      </section>
    );
  }

  return (
    <section className={className}>
      <p className="mb-3 text-xs text-muted-foreground">{periodLabel}</p>
      <ContributionGraph
        variant="attendance"
        data={attendanceData}
        monthsToShow={MONTHS_SHOWN}
        showLegend
        showTooltips
        className="w-full"
      />
    </section>
  );
}
