import { groqRequest } from "@/lib/ai/groq-request";
import { FITNESS_COACH_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type GroqChatRole = "user" | "assistant";

export type GroqChatMessage = {
  role: GroqChatRole;
  content: string;
};

export type GroqChatResult = {
  reply: string;
  model: string;
};

function buildSystemPrompt(userContext?: string): string {
  if (!userContext?.trim()) {
    return FITNESS_COACH_SYSTEM_PROMPT;
  }

  return `${FITNESS_COACH_SYSTEM_PROMPT}

---
USER DATA (from their Fitness Tracker account; factual — do not invent missing entries):

${userContext.trim()}`;
}

/**
 * Calls Groq chat completions, rotating through comma-separated API keys
 * when a key hits rate limits or quota errors.
 */
export async function createGroqChatCompletion(
  messages: GroqChatMessage[],
  options?: { model?: string; userContext?: string },
): Promise<GroqChatResult> {
  const model = options?.model ?? DEFAULT_MODEL;

  const { content, model: usedModel } = await groqRequest({
    model,
    messages: [
      { role: "system", content: buildSystemPrompt(options?.userContext) },
      ...messages,
    ],
    temperature: 0.6,
    max_tokens: 1024,
  });

  return { reply: content, model: usedModel };
}
