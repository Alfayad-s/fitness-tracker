import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/require-user";
import { formatPlanDateLabel } from "@/lib/workout/plan-dates";
import { todayDateString } from "@/lib/workout/format";
import { applyWorkoutPlanPatchAction } from "@/services/daily-plan-actions";
import {
  normalizeWorkoutPlanPatch,
  workoutPlanPatchSchema,
} from "@/types/schemas/daily-plan";

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

  const parsed = workoutPlanPatchSchema.safeParse(
    (body as { patch?: unknown })?.patch,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workout plan update." },
      { status: 400 },
    );
  }

  const patch = normalizeWorkoutPlanPatch(parsed.data);
  const result = await applyWorkoutPlanPatchAction(patch);

  if ("error" in result && result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  revalidatePath("/ai");
  revalidatePath("/dashboard");

  const dateLabel = formatPlanDateLabel(patch.planDate, todayDateString());
  const statusNote =
    patch.status === "skipped"
      ? `${dateLabel} is marked as skipped.`
      : `Workout plan saved for ${dateLabel.toLowerCase()} (${patch.planDate}). View it on your dashboard.`;

  return NextResponse.json({
    message: statusNote,
  });
}
