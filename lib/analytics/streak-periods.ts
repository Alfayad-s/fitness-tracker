export type StreakPeriod = {
  periodStart: string;
  periodEnd: string;
};

/** Merge consecutive workout dates into streak periods for the calendar. */
export function buildStreakPeriods(dates: string[]): StreakPeriod[] {
  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return [];

  const periods: StreakPeriod[] = [];
  let start = unique[0];
  let end = unique[0];

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(`${end}T12:00:00`);
    const curr = new Date(`${unique[i]}T12:00:00`);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      end = unique[i];
    } else {
      periods.push({ periodStart: start, periodEnd: end });
      start = unique[i];
      end = unique[i];
    }
  }

  periods.push({ periodStart: start, periodEnd: end });
  return periods;
}
