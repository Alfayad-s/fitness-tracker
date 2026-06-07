import {
  shouldGenerateFullWorkoutPlan,
  shouldViewWorkoutPlanDetails,
} from "@/lib/ai/should-parse-workout-plan";
import {
  describeRelativePlanDate,
  formatPlanDateLabel,
  parsePlanDateHintFromText,
} from "@/lib/workout/plan-dates";

export type WorkoutPlanQuestionIntent = "view" | "generate" | "edit" | "skip";

export type WorkoutPlanQuestionAnalysis = {
  intent: WorkoutPlanQuestionIntent;
  planDate: string;
  dateLabel: string;
  relativeDescription: string;
  referenceDate: string;
  question: string;
};

function detectIntent(text: string): WorkoutPlanQuestionIntent {
  const note = text.trim().toLowerCase();
  if (/\bskip\b/.test(note) && /\b(today|tomorrow|day\s+after|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})\b/.test(note)) {
    return "skip";
  }
  if (shouldViewWorkoutPlanDetails(text)) return "view";
  if (shouldGenerateFullWorkoutPlan(text)) return "generate";
  return "edit";
}

/**
 * Deterministic study of a workout-plan question: intent + calendar date.
 * Prefer this over LLM date guessing for view/generate flows.
 */
export function analyzeWorkoutPlanQuestion(
  text: string,
  referenceDate: string,
): WorkoutPlanQuestionAnalysis {
  const question = text.trim();
  const planDate =
    parsePlanDateHintFromText(question, referenceDate) ?? referenceDate;

  return {
    intent: detectIntent(question),
    planDate,
    dateLabel: formatPlanDateLabel(planDate, referenceDate),
    relativeDescription: describeRelativePlanDate(planDate, referenceDate),
    referenceDate,
    question,
  };
}

export function resolveTargetPlanDate(
  analysis: WorkoutPlanQuestionAnalysis,
  llmPlanDate?: string,
): string {
  const fromQuestion = parsePlanDateHintFromText(
    analysis.question,
    analysis.referenceDate,
  );
  if (fromQuestion) return fromQuestion;
  if (llmPlanDate && /^\d{4}-\d{2}-\d{2}$/.test(llmPlanDate)) {
    return llmPlanDate;
  }
  return analysis.planDate;
}
