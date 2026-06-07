import { groqRequest } from "@/lib/ai/groq-request";
import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import {
  fetchExercisesUsedByUser,
  fetchSetRowsForAnalytics,
  fetchWorkoutDatesInRange,
  fetchAllWorkoutDates,
} from "@/lib/db/queries/analytics";
import { listWorkoutTemplatesForUser } from "@/lib/db/queries/workout-templates";
import { getDateRange } from "@/lib/analytics/date-range";
import { buildWorkoutAnalytics } from "@/lib/analytics/workout-stats";
import { buildExercisePrsFromSetRows } from "@/lib/ai/format-user-context";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import { GOAL_OPTIONS } from "@/lib/profile/labels";
import {
  aiDailyPlanSchema,
  normalizeAiDailyPlan,
  type AiDailyPlanExtraction,
} from "@/types/schemas/daily-plan";

const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a fitness coach planning ONE training session for today.

Return ONLY valid JSON:
{
  "title": "string",
  "templateId": "uuid or null",
  "rationale": "2-3 sentences why this session fits today",
  "exercises": [
    {
      "exerciseName": "string",
      "muscleGroup": "chest|back|shoulders|legs|arms|core",
      "targetSets": 3,
      "targetReps": 8,
      "targetWeightKg": null,
      "notes": "optional"
    }
  ]
}

Rules:
- Prefer exercise names from the user's catalog when possible.
- If a saved template fits today well, set templateId and still list exercises (can mirror template).
- 4-8 exercises for strength days; 3-5 for short sessions.
- Avoid repeating the same muscle groups trained in the last 48 hours unless goal is endurance.
- Use realistic set/rep targets based on recent history when inferable.
- No markdown.`;

function goalLabel(goalType: string | null): string {
  if (!goalType) return "general fitness";
  return GOAL_OPTIONS.find((o) => o.value === goalType)?.label ?? goalType;
}

export async function generateDailyWorkoutPlan(
  userId: string,
  planDate: string,
): Promise<AiDailyPlanExtraction> {
  const profile = await getUserProfile({ id: userId, email: "" } as never);
  const range14 = getDateRange("30d", { from: undefined, to: planDate });

  const [templates, setRows, datesInRange, allDates, exercisesUsed] =
    await Promise.all([
      listWorkoutTemplatesForUser(userId),
      fetchSetRowsForAnalytics(userId, range14),
      fetchWorkoutDatesInRange(userId, range14),
      fetchAllWorkoutDates(userId),
      fetchExercisesUsedByUser(userId),
    ]);

  const analytics = buildWorkoutAnalytics(setRows, datesInRange, allDates);
  const prs = buildExercisePrsFromSetRows(setRows).slice(0, 12);

  const context = [
    `Plan date: ${planDate}`,
    `Goal: ${goalLabel(profile.goalType ?? null)}`,
    `Current streak: ${analytics.currentStreak} days`,
    `Workouts last 30d: ${analytics.totalWorkouts}`,
    `Saved templates: ${templates.map((t) => `${t.name} (${t.id})`).join("; ") || "none"}`,
    `Recent PRs: ${prs.map((p) => `${p.exerciseName} ${p.estimated1RmKg}kg e1RM`).join("; ") || "none"}`,
    `Exercises used recently: ${exercisesUsed.map((e) => e.name).join(", ") || "none"}`,
  ].join("\n");

  const { content } = await groqRequest({
    model: MODEL,
    temperature: 0.25,
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Generate today's workout plan.\n\n${context}`,
      },
    ],
  });

  const json = parseJsonFromLlm<unknown>(content);
  const parsed = aiDailyPlanSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("AI plan parse failed");
  }

  return normalizeAiDailyPlan(parsed.data);
}
