import type { Feeling } from "@/types";

export function formatWorkoutDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatWorkoutDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export const FEELING_OPTIONS: { value: Feeling; label: string; emoji: string }[] =
  [
    { value: "terrible", label: "Terrible", emoji: "😫" },
    { value: "bad", label: "Bad", emoji: "😕" },
    { value: "okay", label: "Okay", emoji: "😐" },
    { value: "good", label: "Good", emoji: "🙂" },
    { value: "great", label: "Great", emoji: "🔥" },
  ];

export function feelingLabel(feeling: Feeling | null): string {
  if (!feeling) return "—";
  return FEELING_OPTIONS.find((o) => o.value === feeling)?.label ?? feeling;
}

export function todayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
