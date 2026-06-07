import { EXERCISE_IMPORT_EXTRACTION_SYSTEM_PROMPT } from "@/lib/ai/workout-plan-extraction-prompt";
import {
  mimeToDataUrl,
  type AcceptedBmaMimeType,
} from "@/lib/ai/extract-upload-text";
import { groqRequest } from "@/lib/ai/groq-request";
import { parseJsonFromLlm } from "@/lib/ai/parse-json-from-llm";
import {
  exerciseImportSchema,
  normalizeExerciseImport,
  type ExerciseImportExtraction,
} from "@/types/schemas/exercise-import";

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const TEXT_MODEL = "llama-3.3-70b-versatile";

type ParseExerciseImportInput = {
  buffer?: Buffer;
  mimeType?: AcceptedBmaMimeType;
  text?: string;
  userNote?: string;
};

function parseExerciseImportJson(raw: string): ExerciseImportExtraction {
  const json = parseJsonFromLlm<unknown>(raw);
  const parsed = exerciseImportSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      "Could not extract exercises. Try a clearer list or photo.",
    );
  }
  return normalizeExerciseImport(parsed.data);
}

async function extractFromImage(
  buffer: Buffer,
  mimeType: AcceptedBmaMimeType,
  userNote?: string,
): Promise<ExerciseImportExtraction> {
  const dataUrl = mimeToDataUrl(mimeType, buffer.toString("base64"));
  const userText =
    userNote?.trim() ||
    "Extract all exercises from this workout sheet with sets/reps if visible.";

  const { content } = await groqRequest({
    model: VISION_MODEL,
    temperature: 0.15,
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: EXERCISE_IMPORT_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  return parseExerciseImportJson(content);
}

async function extractFromText(
  text: string,
  userNote?: string,
): Promise<ExerciseImportExtraction> {
  const userText = [userNote?.trim(), text.trim()].filter(Boolean).join("\n\n");

  const { content } = await groqRequest({
    model: TEXT_MODEL,
    temperature: 0.15,
    max_tokens: 2048,
    messages: [
      { role: "system", content: EXERCISE_IMPORT_EXTRACTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract exercises:\n\n${userText}`,
      },
    ],
  });

  return parseExerciseImportJson(content);
}

export async function parseExerciseImport(
  input: ParseExerciseImportInput,
): Promise<ExerciseImportExtraction> {
  if (input.buffer && input.mimeType) {
    return extractFromImage(input.buffer, input.mimeType, input.userNote);
  }
  if (input.text?.trim()) {
    return extractFromText(input.text, input.userNote);
  }
  throw new Error("No exercise import content provided.");
}

export function formatExerciseImportPreviewMessage(
  extraction: ExerciseImportExtraction,
): string {
  const lines = ["**Exercises to import**", ""];
  for (const ex of extraction.exercises) {
    const sets = ex.targetSets ? `${ex.targetSets}×` : "";
    const reps = ex.targetReps ? `${ex.targetReps}` : "";
    const detail = sets && reps ? ` (${sets}${reps})` : "";
    lines.push(`• ${ex.name}${detail} — ${ex.muscleGroup ?? "muscle group TBD"}`);
  }
  lines.push("", "Tap **Save exercises** to add them to your library/plan.");
  return lines.join("\n");
}
