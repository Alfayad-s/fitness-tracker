import {
  GroqAllKeysExhaustedError,
  GroqConfigError,
  groqErrorMessage,
  isGroqKeyExhausted,
} from "@/lib/ai/groq-errors";
import { getGroqApiKeys } from "@/lib/ai/groq-keys";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

type GroqCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

export type GroqRequestResult = {
  content: string;
  model: string;
};

function attachGroqError(
  error: Error,
  status: number,
  body: GroqCompletionResponse | null,
) {
  (error as Error & { status?: number }).status = status;
  (error as Error & { groqBody?: GroqCompletionResponse | null }).groqBody =
    body;
}

function isRetriableGroqError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = (error as Error & { status?: number }).status;
  const groqBody = (error as Error & { groqBody?: GroqCompletionResponse | null })
    .groqBody;
  if (status == null) return false;
  return isGroqKeyExhausted(status, groqBody ?? null);
}

async function requestGroqOnce(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<GroqRequestResult> {
  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let parsed: GroqCompletionResponse | null = null;
  try {
    parsed = (await response.json()) as GroqCompletionResponse;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    const err = new Error(groqErrorMessage(response.status, parsed));
    attachGroqError(err, response.status, parsed);
    throw err;
  }

  const content = parsed?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response");
  }

  return {
    content,
    model: String(body.model ?? "unknown"),
  };
}

/** Groq chat completion with automatic API key rotation on rate limits. */
export async function groqRequest(
  body: Record<string, unknown>,
): Promise<GroqRequestResult> {
  const keys = getGroqApiKeys();
  if (keys.length === 0) {
    throw new GroqConfigError();
  }

  let lastError: unknown;

  for (const apiKey of keys) {
    try {
      return await requestGroqOnce(apiKey, body);
    } catch (error) {
      lastError = error;
      if (!isRetriableGroqError(error)) {
        throw error;
      }
    }
  }

  throw new GroqAllKeysExhaustedError(
    lastError instanceof Error ? lastError.message : undefined,
  );
}
