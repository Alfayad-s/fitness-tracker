export type DateRangePreset = "7d" | "30d" | "90d" | "custom";

export type DateRange = {
  from: string;
  to: string;
  preset: DateRangePreset;
};

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDateRange(
  preset: DateRangePreset,
  custom?: { from?: string; to?: string },
): DateRange {
  const toDate = custom?.to ? new Date(`${custom.to}T12:00:00`) : new Date();
  const to = formatDate(toDate);

  if (preset === "custom" && custom?.from) {
    return { from: custom.from, to, preset };
  }

  const fromDate = new Date(toDate);
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  fromDate.setDate(fromDate.getDate() - (days - 1));

  return {
    from: formatDate(fromDate),
    to,
    preset,
  };
}

export function weekKey(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return formatDate(monday);
}
