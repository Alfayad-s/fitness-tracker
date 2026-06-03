import type { BmaExtraction } from "@/types/schemas/bma-report";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";

export type ChatMessageRole = "user" | "assistant";

export type ChatAttachment = {
  type: "image" | "pdf";
  fileName: string;
  /** Blob URL for in-chat image preview (revoke when no longer needed). */
  previewUrl?: string;
};

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  attachment?: ChatAttachment;
  /** Parsed BMA data awaiting user confirmation. */
  bmaExtraction?: BmaExtraction;
  bmaSaved?: boolean;
  /** Parsed meals / hydration awaiting confirmation. */
  nutritionExtraction?: NutritionScanExtraction;
  nutritionSaved?: boolean;
};
