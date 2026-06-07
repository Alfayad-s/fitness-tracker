import { NextResponse } from "next/server";

import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import {
  isAcceptedBmaMime,
  validateBmaUpload,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import {
  formatExerciseImportPreviewMessage,
  parseExerciseImport,
} from "@/lib/ai/parse-exercise-import";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeExerciseImport } from "@/types/schemas/exercise-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const note = formData.get("note");
      const userNote = typeof note === "string" ? note : undefined;

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }

      const mime = file.type || "application/octet-stream";
      if (!isAcceptedBmaMime(mime)) {
        return NextResponse.json(
          { error: "Upload a workout sheet (JPEG, PNG, WebP, GIF, or PDF)." },
          { status: 400 },
        );
      }

      const sizeCheck = validateBmaUpload(mime, file.size);
      if (!sizeCheck.ok) {
        return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const raw = await parseExerciseImport({
        buffer,
        mimeType: mime as AcceptedBmaMimeType,
        userNote,
      });
      const extraction = normalizeExerciseImport(raw);

      if (extraction.exercises.length === 0) {
        return NextResponse.json(
          { error: "No exercises detected. Try a clearer photo or list." },
          { status: 422 },
        );
      }

      return NextResponse.json({
        message: {
          role: "assistant" as const,
          content: formatExerciseImportPreviewMessage(extraction),
          exerciseImport: extraction,
          exerciseImportSaved: false,
        },
        extraction,
      });
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
        : typeof (body as { message?: string }).message === "string"
          ? (body as { message: string }).message
          : null;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Missing message text" }, { status: 400 });
    }

    const raw = await parseExerciseImport({ text: text.trim() });
    const extraction = normalizeExerciseImport(raw);

    if (extraction.exercises.length === 0) {
      return NextResponse.json(
        { error: "No exercises to import. Add more detail." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      message: {
        role: "assistant" as const,
        content: formatExerciseImportPreviewMessage(extraction),
        exerciseImport: extraction,
        exerciseImportSaved: false,
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
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("[api/ai/exercise-import-scan]", error);
    return NextResponse.json(
      { error: "Failed to extract exercises." },
      { status: 500 },
    );
  }
}
