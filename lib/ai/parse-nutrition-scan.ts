import { NUTRITION_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/nutrition-extraction-prompt";
import {
  mimeToDataUrl,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { groqRequest } from "@/lib/ai/groq-request";
import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import {
  nutritionScanSchema,
  normalizeNutritionScan,
  type NutritionScanExtraction,
} from "@/types/schemas/nutrition-scan";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

type ParseNutritionInput = {
  buffer?: Buffer;
  mimeType?: AcceptedBmaMimeType;
  text?: string;
  userNote?: string;
};

function parseNutritionJson(raw: string): NutritionScanExtraction {
  const json = parseJsonFromLlm<unknown>(raw);
  const parsed = nutritionScanSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      "Could not understand the meal or hydration details. Try again with a clearer photo or description.",
    );
  }
  return normalizeNutritionScan(parsed.data);
}

async function extractFromImage(
  buffer: Buffer,
  mimeType: AcceptedBmaMimeType,
  userNote?: string,
): Promise<NutritionScanExtraction> {
  const dataUrl = mimeToDataUrl(mimeType, buffer.toString("base64"));
  const userText =
    userNote?.trim() ||
    "Identify all meals and drinks in this image. Estimate portions, calories, macros, and list ingredients.";

  const { content } = await groqRequest({
    model: VISION_MODEL,
    temperature: 0.15,
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: NUTRITION_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  return parseNutritionJson(content);
}

async function extractFromText(
  text: string,
  userNote?: string,
): Promise<NutritionScanExtraction> {
  const userText = [userNote?.trim(), text.trim()].filter(Boolean).join("\n\n");

  const { content } = await groqRequest({
    model: TEXT_MODEL,
    temperature: 0.15,
    max_tokens: 2048,
    messages: [
      { role: "system", content: NUTRITION_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract meals and hydration to log:\n\n${userText}`,
      },
    ],
  });

  return parseNutritionJson(content);
}

export async function parseNutritionScan(
  input: ParseNutritionInput,
): Promise<NutritionScanExtraction> {
  if (input.buffer && input.mimeType) {
    return extractFromImage(input.buffer, input.mimeType, input.userNote);
  }

  if (input.text?.trim()) {
    return extractFromText(input.text, input.userNote);
  }

  throw new Error("No image or text provided for nutrition scan.");
}
