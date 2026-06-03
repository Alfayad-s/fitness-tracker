import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  bmaExtractionHasMetrics,
  bmaExtractionToMeasurement,
  formatSavedMetricsMessage,
} from "@/lib/ai/bma-to-measurement";
import { createBodyMeasurement } from "@/lib/db/queries/body-measurements";
import { DbError } from "@/lib/db/errors";
import { createClient } from "@/lib/supabase/server";
import {
  bmaExtractionSchema,
  normalizeBmaExtraction,
} from "@/types/schemas/bma-report";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bmaExtractionSchema.safeParse(
    (body as { extraction?: unknown })?.extraction,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid measurement data from report." },
      { status: 400 },
    );
  }

  const extraction = normalizeBmaExtraction(parsed.data);

  if (!bmaExtractionHasMetrics(extraction)) {
    return NextResponse.json(
      { error: "No metrics to save. Scan the report again." },
      { status: 400 },
    );
  }

  try {
    const row = await createBodyMeasurement(
      bmaExtractionToMeasurement(user.id, extraction),
    );

    revalidatePath("/progress");
    revalidatePath("/dashboard");
    revalidatePath("/ai");

    return NextResponse.json({
      measurementId: row.id,
      message: formatSavedMetricsMessage(extraction),
    });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ error: error.userMessage }, { status: 500 });
    }

    console.error("[api/ai/bma-save]", error);
    return NextResponse.json(
      { error: "Could not save measurements. Please try again." },
      { status: 500 },
    );
  }
}
