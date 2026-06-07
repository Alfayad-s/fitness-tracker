import { formatWorkoutDate, todayDateString } from "@/lib/workout/format";

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  const nd = String(date.getDate()).padStart(2, "0");
  return `${ny}-${nm}-${nd}`;
}

export function tomorrowDateString(reference = todayDateString()): string {
  return addDaysToDateString(reference, 1);
}

export function dayAfterTomorrowDateString(reference = todayDateString()): string {
  return addDaysToDateString(reference, 2);
}

export function daysBetweenDateStrings(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const start = new Date(fy, (fm ?? 1) - 1, fd ?? 1);
  const end = new Date(ty, (tm ?? 1) - 1, td ?? 1);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/** Use the user's local calendar day from the client when provided (avoids UTC drift). */
export function resolveReferenceDate(
  candidate: unknown,
  fallback?: string,
): string {
  if (
    typeof candidate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate)
  ) {
    return candidate;
  }
  return fallback ?? todayDateString();
}

export function isTodayPlanDate(planDate: string, reference = todayDateString()): boolean {
  return planDate === reference;
}

export function isTomorrowPlanDate(
  planDate: string,
  reference = todayDateString(),
): boolean {
  return planDate === tomorrowDateString(reference);
}

export function isDayAfterTomorrowPlanDate(
  planDate: string,
  reference = todayDateString(),
): boolean {
  return planDate === dayAfterTomorrowDateString(reference);
}

/** Human label: "Today", "Tomorrow", or formatted date. */
export function formatPlanDateLabel(
  planDate: string,
  reference = todayDateString(),
): string {
  if (isTodayPlanDate(planDate, reference)) return "Today";
  if (isTomorrowPlanDate(planDate, reference)) return "Tomorrow";
  if (isDayAfterTomorrowPlanDate(planDate, reference)) return "Day after tomorrow";
  return formatWorkoutDate(planDate);
}

export function formatPlanDateHeading(
  planDate: string,
  reference = todayDateString(),
): string {
  const label = formatPlanDateLabel(planDate, reference);
  if (label === "Today" || label === "Tomorrow") return label;
  if (label === "Day after tomorrow") {
    return `${label} · ${formatWorkoutDate(planDate)}`;
  }
  return formatWorkoutDate(planDate);
}

function nextWeekdayDateString(
  weekdayName: string,
  reference: string,
  includeToday = false,
): string | null {
  const target = WEEKDAYS.indexOf(weekdayName.toLowerCase() as (typeof WEEKDAYS)[number]);
  if (target < 0) return null;

  const [y, m, d] = reference.split("-").map(Number);
  const ref = new Date(y, (m ?? 1) - 1, d ?? 1);
  const current = ref.getDay();
  let delta = target - current;
  if (delta < 0 || (delta === 0 && !includeToday)) {
    delta += 7;
  }
  if (delta === 0 && !includeToday) delta = 7;

  return addDaysToDateString(reference, delta);
}

/**
 * Best-effort date extraction from natural language before LLM parsing.
 * Returns YYYY-MM-DD or null if no hint found.
 */
export function parsePlanDateHintFromText(
  text: string,
  reference = todayDateString(),
): string | null {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  const iso = trimmed.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  const monthNames =
    "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december";
  const dayMonth = lower.match(
    new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})\\b`, "i"),
  );
  if (dayMonth) {
    const parsed = parseDayMonthYear(dayMonth[1], dayMonth[2], reference);
    if (parsed) return parsed;
  }

  const monthDay = lower.match(
    new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i"),
  );
  if (monthDay) {
    const parsed = parseDayMonthYear(monthDay[2], monthDay[1], reference);
    if (parsed) return parsed;
  }

  if (/\bday\s+after\s+tomorrow'?s?\b/.test(lower)) {
    return dayAfterTomorrowDateString(reference);
  }

  if (/\btomorrow'?s?\b/.test(lower)) {
    return tomorrowDateString(reference);
  }

  if (/\btoday'?s?\b/.test(lower)) {
    return reference;
  }

  const inDays = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDays) {
    const n = Number.parseInt(inDays[1], 10);
    if (n >= 0 && n <= 60) return addDaysToDateString(reference, n);
  }

  for (const day of WEEKDAYS) {
    const nextPattern = new RegExp(`\\bnext\\s+${day}\\b`, "i");
    const onPattern = new RegExp(`\\b(?:on|this)?\\s*${day}\\b`, "i");
    if (nextPattern.test(lower)) {
      return nextWeekdayDateString(day, reference, false);
    }
    if (onPattern.test(lower)) {
      return nextWeekdayDateString(day, reference, true);
    }
  }

  const slashDate = trimmed.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (slashDate) {
    const month = Number.parseInt(slashDate[1], 10);
    const day = Number.parseInt(slashDate[2], 10);
    let year = slashDate[3]
      ? Number.parseInt(slashDate[3], 10)
      : Number.parseInt(reference.slice(0, 4), 10);
    if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function parseDayMonthYear(
  dayStr: string,
  monthStr: string,
  reference: string,
): string | null {
  const day = Number.parseInt(dayStr, 10);
  const month = monthNameToNumber(monthStr);
  if (!month || day < 1 || day > 31) return null;

  let year = Number.parseInt(reference.slice(0, 4), 10);
  const refMonth = Number.parseInt(reference.slice(5, 7), 10);
  const refDay = Number.parseInt(reference.slice(8, 10), 10);
  if (month < refMonth || (month === refMonth && day < refDay)) {
    year += 1;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthNameToNumber(value: string): number | null {
  const key = value.trim().toLowerCase().slice(0, 3);
  const map: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  return map[key] ?? null;
}

export function planDateContextForPrompt(reference = todayDateString()): string {
  const tomorrow = tomorrowDateString(reference);
  const dayAfter = dayAfterTomorrowDateString(reference);
  return [
    `Today (reference): ${reference}`,
    `Tomorrow: ${tomorrow}`,
    `Day after tomorrow: ${dayAfter}`,
    "Resolve relative dates (today, tomorrow, day after tomorrow, next Monday, June 5) to YYYY-MM-DD using this reference.",
  ].join("\n");
}

/** Rich phrase for AI / chat copy, e.g. "day after tomorrow (Mon, Jun 9)". */
export function describeRelativePlanDate(
  planDate: string,
  reference = todayDateString(),
): string {
  const label = formatPlanDateLabel(planDate, reference);
  const formatted = formatWorkoutDate(planDate);
  if (label === "Today" || label === "Tomorrow" || label === "Day after tomorrow") {
    return `${label.toLowerCase()} (${formatted})`;
  }
  const delta = daysBetweenDateStrings(reference, planDate);
  if (delta === 1) return `tomorrow (${formatted})`;
  if (delta === 2) return `day after tomorrow (${formatted})`;
  if (delta > 2) return `in ${delta} days (${formatted})`;
  if (delta < 0) return `${formatted} (past date)`;
  return formatted;
}
