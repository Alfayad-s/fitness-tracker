const NUTRITION_INTENT_PATTERN =
  /\b(meal|meals|food|ate|eaten|eating|breakfast|lunch|dinner|snack|calories|kcal|macro|protein|carbs|fat|hydrat|water|drank|drink|bottle|glass|log\s*(my\s*)?(meal|food|water|lunch|dinner)|nutrition|ingredients|recipe|smoothie|coffee|tea|juice)\b/i;

const BMA_PATTERN =
  /\b(bma|inbody|body\s*composition|body\s*report|scan\s*report)\b/i;

/** Text messages that likely describe food or hydration to log. */
export function shouldParseNutritionFromText(text: string): boolean {
  const note = text.trim();
  if (!note || BMA_PATTERN.test(note)) return false;
  if (NUTRITION_INTENT_PATTERN.test(note)) return true;
  return /\d+\s*(ml|mL|kcal|cal|g\b|grams?|liters?|l\b|cups?)/i.test(note);
}

/**
 * Image uploads: nutrition scan when the user mentions food/drink/logging.
 * PDFs stay on the BMA path only.
 */
export function shouldParseAsNutritionLog(
  file: File,
  userNote: string,
): boolean {
  if (file.type === "application/pdf") return false;
  if (!file.type.startsWith("image/")) return false;
  const note = userNote.trim();
  if (!note) return false;
  if (BMA_PATTERN.test(note)) return false;
  return NUTRITION_INTENT_PATTERN.test(note);
}
