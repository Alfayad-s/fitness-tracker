import { NextResponse } from "next/server";
import { z } from "zod";

import { buildUserAiContext } from "@/lib/ai/build-user-context";
import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import {
  isAcceptedBmaMime,
  validateBmaUpload,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { createGroqVisionChatCompletion } from "@/lib/ai/groq-vision-chat";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 4000;

const chatMessagesSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z
        .string()
        .trim()
        .min(1)
        .max(MAX_CONTENT_LENGTH),
    }),
  )
  .min(1)
  .max(MAX_MESSAGES);

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
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const mime = file.type || "application/octet-stream";
  if (!isAcceptedBmaMime(mime) || mime === "application/pdf") {
    return NextResponse.json(
      { error: "Upload an image as JPEG, PNG, WebP, or GIF." },
      { status: 400 },
    );
  }

  const sizeCheck = validateBmaUpload(mime, file.size);
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
  }

  const messagesRaw = formData.get("messages");
  if (typeof messagesRaw !== "string") {
    return NextResponse.json({ error: "Missing messages" }, { status: 400 });
  }

  let messagesJson: unknown;
  try {
    messagesJson = JSON.parse(messagesRaw);
  } catch {
    return NextResponse.json({ error: "Invalid messages JSON" }, { status: 400 });
  }

  const parsed = chatMessagesSchema.safeParse(messagesJson);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const userContext = await buildUserAiContext(user);
    const result = await createGroqVisionChatCompletion(
      parsed.data,
      { buffer, mimeType: mime as AcceptedBmaMimeType },
      { userContext },
    );

    return NextResponse.json({
      message: { role: "assistant" as const, content: result.reply },
      model: result.model,
    });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return NextResponse.json(
        { error: "AI assistant is not configured on the server." },
        { status: 503 },
      );
    }

    if (error instanceof GroqAllKeysExhaustedError) {
      return NextResponse.json(
        {
          error:
            "All AI keys are temporarily rate limited. Please try again in a minute.",
        },
        { status: 429 },
      );
    }

    console.error("[api/ai/chat-image]", error);
    return NextResponse.json(
      { error: "Could not analyze this image. Please try again." },
      { status: 500 },
    );
  }
}
