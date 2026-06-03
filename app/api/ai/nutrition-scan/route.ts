import { NextResponse } from "next/server";

import {
  formatNutritionPreviewMessage,
  nutritionScanHasItems,
} from "@/lib/ai/nutrition-scan-format";
import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import {
  isAcceptedBmaMime,
  validateBmaUpload,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { parseNutritionScan } from "@/lib/ai/parse-nutrition-scan";
import { requireUser } from "@/lib/auth/require-user";
import { normalizeNutritionScan } from "@/types/schemas/nutrition-scan";

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
        return NextResponse.json({ error: "Missing image" }, { status: 400 });
      }

      const mime = file.type || "application/octet-stream";
      if (!isAcceptedBmaMime(mime) || mime === "application/pdf") {
        return NextResponse.json(
          { error: "Upload a meal or drink photo (JPEG, PNG, WebP, or GIF)." },
          { status: 400 },
        );
      }

      const sizeCheck = validateBmaUpload(mime, file.size);
      if (!sizeCheck.ok) {
        return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const raw = await parseNutritionScan({
        buffer,
        mimeType: mime as AcceptedBmaMimeType,
        userNote,
      });
      const extraction = normalizeNutritionScan(raw);

      if (!nutritionScanHasItems(extraction)) {
        return NextResponse.json(
          {
            error:
              extraction.summary ||
              "No meals or drinks detected. Try another photo or describe what you had.",
          },
          { status: 422 },
        );
      }

      return NextResponse.json({
        message: {
          role: "assistant" as const,
          content: formatNutritionPreviewMessage(extraction),
          nutritionExtraction: extraction,
          nutritionSaved: false,
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

    const raw = await parseNutritionScan({ text: text.trim() });
    const extraction = normalizeNutritionScan(raw);

    if (!nutritionScanHasItems(extraction)) {
      return NextResponse.json(
        {
          error:
            extraction.summary ||
            "No meals or drinks to log. Add more detail about what you ate or drank.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      message: {
        role: "assistant" as const,
        content: formatNutritionPreviewMessage(extraction),
        nutritionExtraction: extraction,
        nutritionSaved: false,
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

    console.error("[api/ai/nutrition-scan]", error);
    return NextResponse.json(
      { error: "Failed to analyze meals and hydration." },
      { status: 500 },
    );
  }
}
