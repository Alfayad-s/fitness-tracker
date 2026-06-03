import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { applyNutritionScanToUser } from "@/lib/ai/apply-nutrition-scan";
import {
  formatNutritionSavedMessage,
  nutritionScanHasItems,
} from "@/lib/ai/nutrition-scan-format";
import { requireUser } from "@/lib/auth/require-user";
import { DbError } from "@/lib/db/errors";
import {
  nutritionScanSchema,
  normalizeNutritionScan,
} from "@/types/schemas/nutrition-scan";

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

  const parsed = nutritionScanSchema.safeParse(
    (body as { extraction?: unknown })?.extraction,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid meal or hydration data." },
      { status: 400 },
    );
  }

  const extraction = normalizeNutritionScan(parsed.data);

  if (!nutritionScanHasItems(extraction)) {
    return NextResponse.json(
      { error: "Nothing to save. Scan again." },
      { status: 400 },
    );
  }

  try {
    const { logDate, log } = await applyNutritionScanToUser(
      auth.user.id,
      extraction,
    );

    revalidatePath("/nutrition", "page");
    revalidatePath("/dashboard", "page");

    return NextResponse.json({
      logDate,
      log,
      message: formatNutritionSavedMessage(extraction, logDate),
    });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.userMessage }, { status: 500 });
    }

    console.error("[api/ai/nutrition-save]", error);
    return NextResponse.json(
      { error: "Could not save to your log. Please try again." },
      { status: 500 },
    );
  }
}
