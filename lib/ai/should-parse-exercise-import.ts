const EXERCISE_IMPORT_PATTERN =
  /\b(add|import|create|new)\s+(exercise|exercises|movement|movements|lift|lifts)\b|\b(exercise\s*list|workout\s*sheet|training\s*plan)\b|\b(bulgarian|romanian|rdl|split\s*squat|hip\s*thrust|lat\s*pulldown)\b/i;

const WORKOUT_PLAN_PATTERN =
  /\b(today'?s?\s*workout|workout\s*plan|training\s*plan|skip\s*today|swap\s*.+\s*for|make\s*today|legs\s*day|push\s*day|pull\s*day|upper\s*body|lower\s*body)\b/i;

/** Text that likely describes exercises to import. */
export function shouldParseExerciseImportFromText(text: string): boolean {
  const note = text.trim();
  if (!note || WORKOUT_PLAN_PATTERN.test(note)) return false;
  return EXERCISE_IMPORT_PATTERN.test(note);
}

/** Image/PDF uploads with exercise import intent. */
export function shouldParseAsExerciseImport(
  file: File,
  userNote: string,
): boolean {
  const note = userNote.trim();
  if (!note) return false;
  if (WORKOUT_PLAN_PATTERN.test(note)) return false;
  return EXERCISE_IMPORT_PATTERN.test(note);
}
