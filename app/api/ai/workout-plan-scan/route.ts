import { NextResponse } from "next/server";

import {
  analyzeWorkoutPlanQuestion,
  resolveTargetPlanDate,
} from "@/lib/ai/analyze-workout-plan-question";
import { generateDailyWorkoutPlan } from "@/lib/ai/generate-daily-workout-plan";
import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import {
  buildWorkoutPlanResponseMeta,
  formatRichWorkoutPlanMessage,
  type WorkoutPlanSource,
} from "@/lib/ai/format-rich-workout-plan-response";
import { parseWorkoutPlanPatchFromText } from "@/lib/ai/parse-workout-plan-patch";
import { requireUser } from "@/lib/auth/require-user";
import { resolveDailyPlanExercises } from "@/lib/workout/resolve-exercise-names";
import {
  loadWorkoutPlanPatchForDate,
  workoutPlanPatchHasExercises,
  type WorkoutPlanLoadSource,
} from "@/lib/workout/load-workout-plan-patch";
import {
  parsePlanDateHintFromText,
  planDateContextForPrompt,
  resolveReferenceDate,
} from "@/lib/workout/plan-dates";
import {
  normalizeWorkoutPlanPatch,
  type WorkoutPlanPatch,
} from "@/types/schemas/daily-plan";

export const runtime = "nodejs";

async function buildGeneratedPlanPatch(
  userId: string,
  planDate: string,
): Promise<WorkoutPlanPatch> {
  const generated = await generateDailyWorkoutPlan(userId, planDate);
  const resolved = await resolveDailyPlanExercises(
    userId,
    generated.exercises,
    true,
  );

  return {
    planDate,
    title: generated.title,
    status: "suggested",
    replaceExercises: resolved,
  };
}

function toResponseSource(loadSource: WorkoutPlanLoadSource): WorkoutPlanSource {
  if (loadSource === "saved") return "saved";
  if (loadSource === "program") return "program";
  return "generated";
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    typeof (body as { text?: string }).text === "string"
      ? (body as { text: string }).text
      : null;

  if (!text?.trim()) {
    return NextResponse.json({ error: "Missing message text" }, { status: 400 });
  }

  const referenceDate = resolveReferenceDate(
    (body as { referenceDate?: string }).referenceDate,
  );
  const analysis = analyzeWorkoutPlanQuestion(text.trim(), referenceDate);

  try {
    let patch: WorkoutPlanPatch;
    let source: WorkoutPlanSource = "generated";

    if (analysis.intent === "view") {
      const loaded = await loadWorkoutPlanPatchForDate(
        auth.user.id,
        analysis.planDate,
      );
      if (loaded && workoutPlanPatchHasExercises(loaded.patch)) {
        patch = { ...loaded.patch, planDate: analysis.planDate };
        source = toResponseSource(loaded.source);
      } else {
        patch = await buildGeneratedPlanPatch(auth.user.id, analysis.planDate);
        source = "generated";
      }
    } else if (analysis.intent === "generate") {
      patch = await buildGeneratedPlanPatch(auth.user.id, analysis.planDate);
      source = "generated";
    } else if (analysis.intent === "skip") {
      patch = {
        planDate: analysis.planDate,
        title: "Rest day",
        status: "skipped",
      };
      source = "generated";
    } else {
      const raw = await parseWorkoutPlanPatchFromText(
        text.trim(),
        analysis.planDate,
        planDateContextForPrompt(referenceDate),
      );
      patch = normalizeWorkoutPlanPatch(raw);
      const targetDate = resolveTargetPlanDate(analysis, patch.planDate);

      if (!workoutPlanPatchHasExercises(patch)) {
        const loaded = await loadWorkoutPlanPatchForDate(
          auth.user.id,
          targetDate,
        );
        if (loaded && workoutPlanPatchHasExercises(loaded.patch)) {
          patch = { ...loaded.patch, planDate: targetDate };
          source = toResponseSource(loaded.source);
        } else {
          patch = await buildGeneratedPlanPatch(auth.user.id, targetDate);
          source = "generated";
        }
      } else {
        patch = { ...patch, planDate: targetDate };
        if (parsePlanDateHintFromText(text.trim(), referenceDate)) {
          source = "generated";
        }
      }
    }

    const meta = buildWorkoutPlanResponseMeta(analysis, patch, source);
    const content = formatRichWorkoutPlanMessage(meta, patch);

    return NextResponse.json({
      message: {
        role: "assistant" as const,
        content,
        workoutPlanPatch: patch,
        workoutPlanMeta: meta,
        workoutPlanSaved: false,
      },
      patch,
      analysis: {
        intent: analysis.intent,
        planDate: analysis.planDate,
        dateLabel: analysis.dateLabel,
      },
    });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return NextResponse.json(
        { error: "AI is not configured on the server." },
        { status: 503 },
      );
    }

    if (error instanceof GroqAllKeysExhaustedError) {
      return NextResponse.json(
        {
          error:
            "AI is temporarily rate limited. Please try again in a minute.",
        },
        { status: 429 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[api/ai/workout-plan-scan]", error);
    return NextResponse.json(
      { error: "Failed to parse workout plan change." },
      { status: 500 },
    );
  }
}
