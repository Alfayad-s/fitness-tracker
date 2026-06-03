/** Parse comma-separated Groq API keys from `GROQ_API_KEYS`. */
export function parseGroqApiKeys(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

export function getGroqApiKeys(): string[] {
  return parseGroqApiKeys(process.env.GROQ_API_KEYS);
}
