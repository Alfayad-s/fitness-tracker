import { WORKOUT_PLAN_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/workout-plan-extraction-prompt";
import { groqRequest } from "@/lib/ai/groq-request";
import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import {
  formatPlanDateLabel,
  planDateContextForPrompt,
} from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import {
  workoutPlanPatchSchema,
  normalizeWorkoutPlanPatch,
  type WorkoutPlanPatch,
} from "@/types/schemas/daily-plan";

const MODEL = "llama-3.3-70b-versatile";

export async function parseWorkoutPlanPatchFromText(
  text: string,
  defaultPlanDate: string,
  userContext?: string,
): Promise<WorkoutPlanPatch> {
  const { content } = await groqRequest({
    model: MODEL,
    temperature: 0.15,
    max_tokens: 2048,
    messages: [
      { role: "system", content: WORKOUT_PLAN_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          userContext?.trim(),
          planDateContextForPrompt(defaultPlanDate),
          `Default planDate if unspecified: ${defaultPlanDate}`,
          `User message:\n${text.trim()}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
      },
    ],
  });

  const json = parseJsonFromLlm<unknown>(content);
  const parsed = workoutPlanPatchSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      "Could not understand the workout plan change. Try being more specific.",
    );
  }

  const normalized = normalizeWorkoutPlanPatch(parsed.data);
  if (!normalized.planDate) {
    normalized.planDate = defaultPlanDate;
  }
  return normalized;
}

export function formatWorkoutPlanPreviewMessage(
  patch: WorkoutPlanPatch,
  referenceDate = todayDateString(),
): string {
  const dateLabel = formatPlanDateLabel(patch.planDate, referenceDate);
  const lines = [`**${patch.title ?? "Updated plan"}** — ${dateLabel} (${patch.planDate})`];

  if (patch.status === "skipped") {
    lines.push("", `${dateLabel} will be marked as a rest/skipped day.`);
    return lines.join("\n");
  }

  const exercises =
    patch.replaceExercises ?? patch.addExercises ?? [];

  if (exercises.length > 0) {
    lines.push("", "Exercises:");
    for (const ex of exercises) {
      const sets = ex.targetSets ? `${ex.targetSets} sets` : "sets TBD";
      const reps = ex.targetReps ? ` × ${ex.targetReps} reps` : "";
      lines.push(`• ${ex.exerciseName} — ${sets}${reps}`);
    }
  }

  if (patch.removeExerciseNames?.length) {
    lines.push("", `Remove: ${patch.removeExerciseNames.join(", ")}`);
  }

  lines.push("", `Tap **Save plan for ${dateLabel.toLowerCase()}** to confirm.`);
  return lines.join("\n");
}
