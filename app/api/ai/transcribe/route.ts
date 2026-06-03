import { NextResponse } from "next/server";

import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
} from "@/lib/ai/groq-errors";
import { transcribeAudioWithGroq } from "@/lib/ai/groq-transcribe";
import { requireUser } from "@/lib/auth/require-user";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (!file.type.startsWith("audio/") && file.type !== "video/webm") {
    return NextResponse.json(
      { error: "Upload a supported audio recording." },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Recording must be under 25 MB." },
      { status: 400 },
    );
  }

  if (file.size < 500) {
    return NextResponse.json(
      { error: "Recording too short. Hold the mic a little longer." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await transcribeAudioWithGroq(
      buffer,
      file.type || "audio/webm",
      file.name || "recording.webm",
    );

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof GroqConfigError) {
      return NextResponse.json(
        { error: "Voice transcription is not configured on the server." },
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

    console.error("[api/ai/transcribe]", error);
    return NextResponse.json(
      { error: "Could not transcribe audio." },
      { status: 500 },
    );
  }
}
