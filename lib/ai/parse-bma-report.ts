import { BMA_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/bma-extraction-prompt";
import {
  extractTextFromPdf,
  mimeToDataUrl,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { groqRequest } from "@/lib/ai/groq-request";
import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import {
  bmaExtractionSchema,
  type BmaExtraction,
} from "@/types/schemas/bma-report";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

type ParseBmaInput = {
  buffer: Buffer;
  mimeType: AcceptedBmaMimeType;
  userNote?: string;
};

async function extractFromImage(
  buffer: Buffer,
  mimeType: AcceptedBmaMimeType,
  userNote?: string,
): Promise<BmaExtraction> {
  const base64 = buffer.toString("base64");
  const dataUrl = mimeToDataUrl(mimeType, base64);

  const userText =
    userNote?.trim() ||
    "Extract all body composition metrics from this BMA / body analysis report.";

  const { content } = await groqRequest({
    model: VISION_MODEL,
    temperature: 0.1,
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: BMA_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  return parseBmaJson(content);
}

async function extractFromPdfText(
  text: string,
  userNote?: string,
): Promise<BmaExtraction> {
  if (text.length < 20) {
    throw new Error(
      "Could not read text from this PDF. Upload a photo/screenshot of the report, or a text-based PDF.",
    );
  }

  const clipped = text.length > 12_000 ? `${text.slice(0, 12_000)}\n...[truncated]` : text;

  const userText = [
    userNote?.trim(),
    "Report text:",
    clipped,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { content } = await groqRequest({
    model: TEXT_MODEL,
    temperature: 0.1,
    max_tokens: 2048,
    messages: [
      { role: "system", content: BMA_EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: userText },
    ],
  });

  return parseBmaJson(content);
}

function parseBmaJson(raw: string): BmaExtraction {
  const json = parseJsonFromLlm<unknown>(raw);
  const parsed = bmaExtractionSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      "Could not understand the report format. Try a clearer photo or enter measurements manually on Progress.",
    );
  }
  return parsed.data;
}

export async function parseBmaReportFromUpload(
  input: ParseBmaInput,
): Promise<BmaExtraction> {
  if (input.mimeType === "application/pdf") {
    const text = await extractTextFromPdf(input.buffer);
    return extractFromPdfText(text, input.userNote);
  }

  return extractFromImage(input.buffer, input.mimeType, input.userNote);
}
