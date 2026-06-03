import { NextResponse } from "next/server";
import { z } from "zod";

import { buildUserAiContext } from "@/lib/ai/build-user-context";
import { createGroqChatCompletion } from "@/lib/ai/groq-chat";
import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import { createClient } from "@/lib/supabase/server";

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 4000;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .trim()
          .min(1, "Message cannot be empty")
          .max(MAX_CONTENT_LENGTH),
      }),
    )
    .min(1)
    .max(MAX_MESSAGES),
});

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

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const userContext = await buildUserAiContext(user);
    const result = await createGroqChatCompletion(parsed.data.messages, {
      userContext,
    });
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

    console.error("[api/ai/chat]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
