import type { BmaExtraction } from "@/types/schemas/bma-report";
import type { NutritionScanExtraction } from "@/types/schemas/nutrition-scan";
import type { ExerciseImportExtraction } from "@/types/schemas/exercise-import";
import type { WorkoutPlanPatch } from "@/types/schemas/daily-plan";
import type { WorkoutPlanResponseMeta } from "@/lib/ai/format-rich-workout-plan-response";

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
  /** Parsed daily workout plan patch awaiting confirmation. */
  workoutPlanPatch?: WorkoutPlanPatch;
  workoutPlanMeta?: WorkoutPlanResponseMeta;
  workoutPlanSaved?: boolean;
  /** Parsed exercise import awaiting confirmation. */
  exerciseImport?: ExerciseImportExtraction;
  exerciseImportSaved?: boolean;
};
