const WORKOUT_PLAN_PATTERN =
  /\b(today'?s?\s*workout|tomorrow'?s?\s*(workout|training|session)?|day\s+after\s+tomorrow|workout\s*plan|training\s*plan|schedule\s*(a\s*)?workout|plan\s*(my\s*)?(workout|training)|skip\s*(today|tomorrow|day\s+after\s+tomorrow)|rest\s*day|swap\s+.+\s+for|make\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|legs\s*day|push\s*day|pull\s*day|upper\s*body|lower\s*body|add\s+.+\s+to\s+(today|tomorrow)|remove\s+.+\s+from\s+(today|tomorrow)|next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;

const GENERATE_PLAN_PATTERN =
  /\b(plan|schedule|suggest|generate|create)\b.*\b(workout|training|session|leg|push|pull|upper|lower)\b/i;

const START_SUGGESTED_PATTERN =
  /\b(start|begin|do)\s+(my\s+)?(suggested|planned|today'?s?|tomorrow'?s?)\s+workout\b/i;

const VIEW_PLAN_PATTERN =
  /\b(give|show|tell|what|what'?s|details?|detail\s+of|describe|explain|list|breakdown|share)\b.*\b(today|tomorrow|day\s+after\s+tomorrow|workout|plan|training|session|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})\b/i;

const VIEW_PLAN_ALT_PATTERN =
  /\b(today|tomorrow|day\s+after\s+tomorrow)('s)?\s+(workout|plan|training|session)\b.*\b(details?|detail|exercises?|breakdown)\b/i;

export function shouldParseWorkoutPlanFromText(text: string): boolean {
  const note = text.trim();
  if (!note) return false;
  return WORKOUT_PLAN_PATTERN.test(note) || GENERATE_PLAN_PATTERN.test(note);
}

/** User wants a full AI-generated session for a date (not a small patch). */
export function shouldGenerateFullWorkoutPlan(text: string): boolean {
  const note = text.trim().toLowerCase();
  if (!note) return false;
  if (shouldViewWorkoutPlanDetails(text)) return false;
  if (!GENERATE_PLAN_PATTERN.test(note)) return false;
  // Specific exercise edits → patch flow
  if (/\b(add|remove|swap|replace)\b/.test(note)) return false;
  return true;
}

/** User wants to see an existing plan, not create/edit one. */
export function shouldViewWorkoutPlanDetails(text: string): boolean {
  const note = text.trim().toLowerCase();
  if (!note) return false;

  if (/\b(add|remove|swap|replace|skip|make)\b/.test(note)) return false;
  if (/\b(schedule|suggest|generate|create)\b/.test(note)) return false;
  // "plan" as a verb (plan my workout), not the noun "workout plan"
  if (
    /\bplan\s+(my|a|an|the|tomorrow|today|next|for)\b/.test(note) ||
    /\bplan\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|leg|push|pull|upper|lower)\b/.test(
      note,
    )
  ) {
    return false;
  }

  return (
    VIEW_PLAN_PATTERN.test(note) ||
    VIEW_PLAN_ALT_PATTERN.test(note) ||
    /\b(today|tomorrow|day\s+after\s+tomorrow)\s+workout\s+plan\b/.test(note) ||
    /\bday\s+after\s+tomorrow\b.*\b(workout|plan)\b/.test(note)
  );
}

export function shouldNavigateToSuggestedWorkout(text: string): boolean {
  return START_SUGGESTED_PATTERN.test(text.trim());
}
