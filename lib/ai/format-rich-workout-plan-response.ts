import type { WorkoutPlanQuestionAnalysis } from "@/lib/ai/analyze-workout-plan-question";
import { formatWorkoutDate } from "@/lib/workout/format";
import type { WorkoutPlanPatch } from "@/types/schemas/daily-plan";

export type WorkoutPlanSource = "saved" | "program" | "generated";

export type WorkoutPlanResponseMeta = {
  source: WorkoutPlanSource;
  summary: string;
  intro: string;
  exerciseCount: number;
  isRestDay: boolean;
};

function countExercises(patch: WorkoutPlanPatch): number {
  return (
    patch.replaceExercises?.length ?? patch.addExercises?.length ?? 0
  );
}

function sourceLabel(source: WorkoutPlanSource): string {
  switch (source) {
    case "saved":
      return "your saved plan";
    case "program":
      return "your active weekly program";
    case "generated":
      return "a fresh AI suggestion";
  }
}

function muscleSummary(patch: WorkoutPlanPatch): string | null {
  const exercises = patch.replaceExercises ?? patch.addExercises ?? [];
  const groups = [
    ...new Set(
      exercises
        .map((ex) => ex.muscleGroup)
        .filter(Boolean)
        .map((g) => String(g)),
    ),
  ];
  if (groups.length === 0) return null;
  return groups.slice(0, 4).join(", ");
}

export function buildWorkoutPlanResponseMeta(
  analysis: WorkoutPlanQuestionAnalysis,
  patch: WorkoutPlanPatch,
  source: WorkoutPlanSource,
): WorkoutPlanResponseMeta {
  const exerciseCount = countExercises(patch);
  const title = patch.title ?? "Workout";
  const isRestDay =
    patch.status === "skipped" ||
    (exerciseCount === 0 && title.toLowerCase().includes("rest"));

  const formattedDate = formatWorkoutDate(patch.planDate);

  if (isRestDay) {
    return {
      source,
      exerciseCount: 0,
      isRestDay: true,
      intro: `**${title}** on **${formattedDate}** (${analysis.relativeDescription}) is scheduled as a **rest day**.`,
      summary: "Recovery day — no training session planned.",
    };
  }

  const muscles = muscleSummary(patch);
  const intro = [
    `Here's **${title}** for **${formattedDate}** (${analysis.relativeDescription}).`,
    `Pulled from **${sourceLabel(source)}** with **${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"}**.`,
  ].join(" ");

  const summaryParts = [
    muscles ? `Focus: ${muscles}` : null,
    exerciseCount >= 6 ? "Full session (~90 min with warm-up & core)" : null,
  ].filter(Boolean);

  return {
    source,
    exerciseCount,
    isRestDay: false,
    intro,
    summary: summaryParts.join(" · ") || "Review exercises below, then save if it looks good.",
  };
}

export function formatRichWorkoutPlanMessage(
  meta: WorkoutPlanResponseMeta,
  patch: WorkoutPlanPatch,
): string {
  const lines = [meta.intro, "", meta.summary];

  if (!meta.isRestDay && meta.exerciseCount > 0) {
    lines.push("", "**Top exercises**");
    const exercises = patch.replaceExercises ?? patch.addExercises ?? [];
    for (const ex of exercises.slice(0, 4)) {
      const sets = ex.targetSets ? `${ex.targetSets}×${ex.targetReps ?? "?"}` : "";
      lines.push(`• ${ex.exerciseName}${sets ? ` — ${sets}` : ""}`);
    }
    if (exercises.length > 4) {
      lines.push(`• +${exercises.length - 4} more in the card below`);
    }
  }

  lines.push("", "Save below to add this to your calendar.");
  return lines.join("\n");
}
