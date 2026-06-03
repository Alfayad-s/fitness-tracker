import {
  mimeToDataUrl,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { groqRequest } from "@/lib/ai/groq-request";
import type { GroqChatMessage, GroqChatResult } from "@/lib/ai/groq-chat";
import { FITNESS_COACH_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

function buildSystemPrompt(userContext?: string): string {
  if (!userContext?.trim()) {
    return FITNESS_COACH_SYSTEM_PROMPT;
  }

  return `${FITNESS_COACH_SYSTEM_PROMPT}

---
USER DATA (from their Fitness Tracker account; factual — do not invent missing entries):

${userContext.trim()}`;
}

const DEFAULT_IMAGE_PROMPT =
  "The user attached this image. Describe what you see and answer based on their message and fitness context. If it is a body composition / InBody / BMA report, summarize the key metrics; if it is something else (food, exercise form, equipment, etc.), help with that instead.";

/**
 * Vision chat: prior turns are text-only; the latest user turn includes the image.
 */
export async function createGroqVisionChatCompletion(
  messages: GroqChatMessage[],
  image: { buffer: Buffer; mimeType: AcceptedBmaMimeType },
  options?: { userContext?: string },
): Promise<GroqChatResult> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUser?.content?.trim() || DEFAULT_IMAGE_PROMPT;

  const prior = messages.slice(0, -1);

  const dataUrl = mimeToDataUrl(
    image.mimeType,
    image.buffer.toString("base64"),
  );

  const visionUserContent = [
    { type: "text", text: userText },
    { type: "image_url", image_url: { url: dataUrl } },
  ];

  const { content, model } = await groqRequest({
    model: VISION_MODEL,
    temperature: 0.6,
    max_completion_tokens: 1024,
    messages: [
      { role: "system", content: buildSystemPrompt(options?.userContext) },
      ...prior.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: visionUserContent },
    ],
  });

  return { reply: content, model };
}
