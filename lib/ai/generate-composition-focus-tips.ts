import { cache } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import { groqRequest } from "@/lib/ai/groq-request";
import { listBodyMeasurementsByUser } from "@/lib/db/queries/body-measurements";
import {
  computeCompositionScore,
  scoreLabel,
} from "@/lib/measurements/composition-score";
import { buildBodyCompositionTrendPoints } from "@/lib/measurements/body-composition-trends";
import { GOAL_OPTIONS } from "@/lib/profile/labels";
import { getUserProfile } from "@/lib/profile/get-user-profile";
import {
  compositionFocusTipsSchema,
  type CompositionFocusTips,
} from "@/types/schemas/composition-tips";
import type { BodyMeasurement } from "@/types";
import type { BodyCompositionTrendPoint } from "@/types/analytics";
import type { GoalType } from "@/types";

const TIPS_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are a fitness coach inside a workout tracking app. The user sees a "composition score" (0–100) derived from their BMA/InBody-style body measurements — not an official InBody score.

Return ONLY valid JSON:
{
  "focusNext": ["bullet 1", "bullet 2", "bullet 3"],
  "nextScanAdvice": "2-3 sentences on when and how to get their next body composition scan for consistent tracking",
  "bmiNote": "1-2 sentences on their BMI trend and one practical step to improve or maintain it safely"
}

Rules:
- Be specific to the numbers and trend provided; do not invent data.
- Tie advice to their stated fitness goal when present.
- focusNext: actionable priorities (training, nutrition, recovery, what metric to improve).
- nextScanAdvice: practical timing (e.g. same time of day, fasted, monthly), mention they can upload a photo/PDF in the AI tab.
- bmiNote: if BMI missing, explain they need weight + height on profile or report; never give medical diagnosis.
- Tone: supportive, concise, plain language. No markdown in strings.`;

function goalLabel(goalType: GoalType | null): string {
  if (!goalType) return "Not set";
  return GOAL_OPTIONS.find((o) => o.value === goalType)?.label ?? goalType;
}

function buildTipsContext(
  goalType: GoalType | null,
  latestRow: BodyMeasurement | null,
  trends: BodyCompositionTrendPoint[],
): string {
  const latest = trends.at(-1);
  const previous = trends.length >= 2 ? trends.at(-2) : null;

  const lines: string[] = [
    `Fitness goal: ${goalLabel(goalType)}`,
    `Number of logged scans: ${trends.length}`,
  ];

  if (latestRow) {
    const score = computeCompositionScore(latestRow);
    const bmi = latestRow.bmi != null ? Number(latestRow.bmi) : null;
    lines.push(
      `Latest scan (${formatDate(latestRow.recordedAt)}): score=${score ?? "n/a"}${score != null ? ` (${scoreLabel(score)})` : ""}, weight=${latestRow.weightKg ?? "n/a"} kg, BMI=${bmi ?? "n/a"}, body fat=${latestRow.bodyFatPercent ?? "n/a"}%, protein=${latestRow.proteinKg ?? "n/a"} kg, water=${latestRow.bodyWaterKg ?? "n/a"} kg (${latestRow.bodyWaterPercent ?? "n/a"}%), bone=${latestRow.boneMassKg ?? "n/a"} kg, muscle=${latestRow.muscleMassKg ?? latestRow.skeletalMuscleMassKg ?? "n/a"} kg`,
    );
  } else if (latest) {
    lines.push(
      `Latest scan (${latest.date}): score=${latest.score ?? "n/a"}, weight=${latest.weightKg ?? "n/a"} kg`,
    );
  }

  if (previous && latest) {
    const scoreDelta =
      latest.score != null && previous.score != null
        ? latest.score - previous.score
        : null;
    if (scoreDelta != null) {
      lines.push(`Score change vs previous scan: ${scoreDelta > 0 ? "+" : ""}${scoreDelta}`);
    }
    if (latest.weightKg != null && previous.weightKg != null) {
      lines.push(
        `Weight change: ${(latest.weightKg - previous.weightKg).toFixed(1)} kg`,
      );
    }
  }

  if (trends.length >= 3) {
    const scores = trends.map((t) => t.score).filter((s): s is number => s != null);
    if (scores.length >= 2) {
      lines.push(`Score history: ${scores.join(" → ")}`);
    }
  }

  return lines.join("\n");
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function staticCompositionFocusTips(): CompositionFocusTips {
  return {
    focusNext: [
      "Log consistent workouts and protein intake to support muscle mass on your next scan.",
      "Track body fat and waist measurements alongside weight — not just the scale.",
      "Sleep and hydration affect water % readings; keep conditions similar each scan.",
    ],
    nextScanAdvice:
      "For a fair comparison, repeat your scan every 4–6 weeks at the same time of day (morning, before training, similar hydration). Upload the report photo or PDF in the AI tab to auto-fill your metrics.",
    bmiNote:
      "BMI only reflects weight and height. Pair it with body fat % and muscle mass from a composition scan for a clearer picture of progress.",
  };
}

async function generateCompositionFocusTipsUncached(
  authUser: SupabaseUser,
): Promise<CompositionFocusTips> {
  const [{ measurements }, profile] = await Promise.all([
    listBodyMeasurementsByUser(authUser.id, 24),
    getUserProfile(authUser),
  ]);

  const latestRow = measurements[0] ?? null;
  const trends = buildBodyCompositionTrendPoints(measurements);

  if (trends.length === 0) {
    return {
      focusNext: [
        "Log your first measurement under Progress or upload a BMA report in the AI tab.",
        "Set your fitness goal in Profile so tips match lose fat, muscle gain, or strength.",
        "After two scans, your composition score trend will appear here.",
      ],
      nextScanAdvice:
        "Book an InBody or gym body-composition test, or upload a clear photo of the printout in AI → attach report. Use the same machine or conditions next time for comparable results.",
      bmiNote:
        "Add height on your profile and log weight on each scan to track BMI alongside composition.",
    };
  }

  try {
    const { content } = await groqRequest({
      model: TIPS_MODEL,
      temperature: 0.5,
      max_tokens: 600,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildTipsContext(profile.goalType, latestRow, trends),
        },
      ],
    });

    const parsed = compositionFocusTipsSchema.safeParse(
      parseJsonFromLlm<unknown>(content),
    );

    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // fall through to static tips enriched with latest score
  }

  const fallback = staticCompositionFocusTips();
  const latest = trends.at(-1);
  if (latest?.score != null) {
    fallback.focusNext[0] = `Your latest composition score is ${latest.score} (${scoreLabel(latest.score)}) — ${fallback.focusNext[0]}`;
  }
  return fallback;
}

export const generateCompositionFocusTips = cache(
  generateCompositionFocusTipsUncached,
);
