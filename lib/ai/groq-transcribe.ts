import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
  isGroqKeyExhausted,
} from "@/lib/ai/groq-errors";
import { getGroqApiKeys } from "@/lib/ai/groq-keys";

const GROQ_TRANSCRIBE_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";

const WHISPER_MODEL = "whisper-large-v3-turbo";

type TranscriptionResponse = {
  text?: string;
  error?: { message?: string };
};

export async function transcribeAudioWithGroq(
  buffer: Buffer,
  mimeType: string,
  filename = "recording.webm",
): Promise<string> {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    throw new GroqConfigError();
  }

  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  let lastError: unknown;

  for (const apiKey of keys) {
    const formData = new FormData();
    formData.append("file", blob, filename);
    formData.append("model", WHISPER_MODEL);
    formData.append("language", "en");
    formData.append("response_format", "json");

    try {
      const response = await fetch(GROQ_TRANSCRIBE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      let parsed: TranscriptionResponse | null = null;
      try {
        parsed = (await response.json()) as TranscriptionResponse;
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        const err = new Error(
          parsed?.error?.message ?? `Transcription failed (${response.status})`,
        );
        (err as Error & { status?: number }).status = response.status;
        if (isGroqKeyExhausted(response.status, parsed as { error?: { message?: string } })) {
          lastError = err;
          continue;
        }
        throw err;
      }

      const text = parsed?.text?.trim();
      if (!text) {
        throw new Error("No speech detected. Try speaking again.");
      }
      return text;
    } catch (error) {
      lastError = error;
      if (
        error instanceof Error &&
        isGroqKeyExhausted(
          (error as Error & { status?: number }).status ?? 0,
          null,
        )
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new GroqAllKeysExhaustedError(
    lastError instanceof Error ? lastError.message : undefined,
  );
}
