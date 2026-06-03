const BMA_INTENT_PATTERN =
  /\b(bma|inbody|in\s*body|body\s*composition|body\s*analysis|body\s*scan|composition\s*report|scan\s*report|dexa|impedance|visceral|skeletal\s*muscle|extract\s*metrics|save\s*(my\s*)?measurements|log\s*(this\s*)?report)\b/i;

/** User clearly wants general image help, not a body report scan. */
const GENERAL_IMAGE_PATTERN =
  /\b(not\s+(a\s+)?(bma|report)|form\s*check|technique|what\s+is\s+this|what('s| is)\s+in|look\s+at|analyze\s+this|help\s+me\s+understand|food|meal|recipe|outfit|meme|screenshot)\b/i;

/**
 * PDF uploads are always parsed as BMA/body-composition reports.
 * Images use the user's message; default is general vision chat.
 */
export function shouldParseAsBmaReport(file: File, userNote: string): boolean {
  if (file.type === "application/pdf") return true;

  const note = userNote.trim();
  if (!note) return false;
  if (GENERAL_IMAGE_PATTERN.test(note)) return false;
  return BMA_INTENT_PATTERN.test(note);
}
