import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { applyWorkoutPlanPatch } from "@/lib/db/queries/daily-plans";
import {
  getWorkoutTemplateForUser,
  updateWorkoutTemplate,
} from "@/lib/db/queries/workout-templates";
import { resolveExerciseImportItems } from "@/lib/workout/resolve-exercise-names";
import { todayDateString } from "@/lib/workout/format";
import {
  exerciseImportSchema,
  normalizeExerciseImport,
} from "@/types/schemas/exercise-import";

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

  const parsed = exerciseImportSchema.safeParse(
    (body as { extraction?: unknown })?.extraction,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid exercise import data." },
      { status: 400 },
    );
  }

  const extraction = normalizeExerciseImport(parsed.data);
  if (extraction.exercises.length === 0) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  try {
    const resolved = await resolveExerciseImportItems(
      auth.user.id,
      extraction.exercises,
      true,
    );

    const names = resolved.map((ex) => ex.name).join(", ");
    let message = `Saved ${resolved.length} exercise(s) to your library: ${names}.`;

    if (extraction.applyTo === "today_plan") {
      const planDate = extraction.planDate ?? todayDateString();
      await applyWorkoutPlanPatch(auth.user.id, {
        planDate,
        addExercises: resolved.map((ex) => ({
          exerciseName: ex.name,
          exerciseId: ex.exerciseId,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeightKg: ex.targetWeightKg,
          notes: ex.notes,
        })),
      });
      message += " Added to today's workout plan.";
    } else if (extraction.applyTo === "template" && extraction.templateId) {
      const template = await getWorkoutTemplateForUser(
        extraction.templateId,
        auth.user.id,
      );
      if (template) {
        const startIndex = template.exercises.length;
        await updateWorkoutTemplate(extraction.templateId, auth.user.id, {
          name: template.name,
          exercises: [
            ...template.exercises.map((ex) => ({
              exerciseId: ex.exerciseId,
              orderIndex: ex.orderIndex,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeightKg: ex.targetWeightKg,
              notes: ex.notes,
            })),
            ...resolved.map((ex, i) => ({
              exerciseId: ex.exerciseId,
              orderIndex: startIndex + i,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              targetWeightKg: ex.targetWeightKg,
              notes: ex.notes,
            })),
          ],
        });
        message += ` Appended to template "${template.name}".`;
      }
    }

    revalidatePath("/workouts");
    revalidatePath("/workouts/templates");
    revalidatePath("/workouts/new");
    revalidatePath("/dashboard");
    revalidatePath("/ai");

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[api/ai/exercise-import-save]", error);
    return NextResponse.json(
      { error: "Could not save exercises. Please try again." },
      { status: 500 },
    );
  }
}
