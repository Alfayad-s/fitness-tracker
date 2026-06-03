export class GroqConfigError extends Error {
  constructor(message = "GROQ_API_KEYS is not configured") {
    super(message);
    this.name = "GroqConfigError";
  }
}

export class GroqAllKeysExhaustedError extends Error {
  constructor(message = "All Groq API keys are rate limited. Try again shortly.") {
    super(message);
    this.name = "GroqAllKeysExhaustedError";
  }
}

type GroqErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

export function isGroqKeyExhausted(
  status: number,
  body: GroqErrorBody | null,
): boolean {
  if (status === 429 || status === 503) return true;

  const code = body?.error?.code?.toLowerCase() ?? "";
  const message = body?.error?.message?.toLowerCase() ?? "";

  if (code.includes("rate_limit") || code.includes("quota")) return true;
  if (message.includes("rate limit") || message.includes("quota")) return true;

  return false;
}

export function groqErrorMessage(
  status: number,
  body: GroqErrorBody | null,
): string {
  return (
    body?.error?.message ??
    `Groq request failed (${status})`
  );
}
