import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  bmaExtractionHasMetrics,
  formatBmaPreviewMessage,
} from "@/lib/ai/bma-to-measurement";
import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import {
  isAcceptedBmaMime,
  validateBmaUpload,
} from "@/lib/ai/extract-upload-text";
import { parseBmaReportFromUpload } from "@/lib/ai/parse-bma-report";
import { createClient } from "@/lib/supabase/server";
import { normalizeBmaExtraction } from "@/types/schemas/bma-report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing report file" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!isAcceptedBmaMime(mime)) {
    return NextResponse.json(
      {
        error: "Upload a BMA report as JPEG, PNG, WebP, GIF, or PDF.",
      },
      { status: 400 },
    );
  }

  const sizeCheck = validateBmaUpload(mime, file.size);
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
  }

  const note = formData.get("note");
  const userNote = typeof note === "string" ? note : undefined;

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const raw = await parseBmaReportFromUpload({
      buffer,
      mimeType: mime,
      userNote,
    });
    const extraction = normalizeBmaExtraction(raw);

    if (!bmaExtractionHasMetrics(extraction)) {
      return NextResponse.json(
        {
          error:
            "No body metrics could be read from this report. Try a clearer image or log measurements manually on Progress.",
        },
        { status: 422 },
      );
    }

    const assistantContent = formatBmaPreviewMessage(extraction);

    return NextResponse.json({
      message: {
        role: "assistant" as const,
        content: assistantContent,
        bmaExtraction: extraction,
        bmaSaved: false,
      },
      extraction,
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
      const clientErrors = [
        "Could not read text",
        "Could not understand",
        "No JSON",
      ];
      if (clientErrors.some((m) => error.message.includes(m))) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
    }

    console.error("[api/ai/bma-scan]", error);
    return NextResponse.json(
      { error: "Failed to scan BMA report. Please try again." },
      { status: 500 },
    );
  }
}
