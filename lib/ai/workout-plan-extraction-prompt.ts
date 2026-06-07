export const WORKOUT_PLAN_EXTRACTION_SYSTEM_PROMPT = `You update a user's daily workout plan from natural language.

Return ONLY valid JSON:
{
  "planDate": "YYYY-MM-DD",
  "title": "optional new title",
  "status": "suggested|accepted|skipped|completed",
  "replaceExercises": [
    {
      "exerciseName": "string",
      "muscleGroup": "chest|back|shoulders|legs|arms|core",
      "targetSets": 3,
      "targetReps": 10,
      "targetWeightKg": null,
      "notes": null
    }
  ],
  "addExercises": [],
  "removeExerciseNames": []
}

Rules:
- planDate is REQUIRED. Resolve relative dates: today, tomorrow, next Monday, June 5, 2026-06-05.
- Use the reference dates provided in the user message — never guess the wrong year.
- For "skip today/tomorrow" set status to skipped for that date.
- For full replacement (e.g. "plan tomorrow as legs") use replaceExercises with 4-8 exercises.
- For "add X to tomorrow" use addExercises only and set planDate to tomorrow.
- For "remove X" or "swap X for Y" use removeExerciseNames and/or addExercises.
- Prefer exercise names from the user's catalog when provided in context.`;

export const EXERCISE_IMPORT_EXTRACTION_SYSTEM_PROMPT = `Extract exercises to add to a fitness app from text or images.

Return ONLY valid JSON:
{
  "exercises": [
    {
      "name": "string",
      "muscleGroup": "chest|back|shoulders|legs|arms|core",
      "equipment": "optional",
      "targetSets": 3,
      "targetReps": 10,
      "targetWeightKg": null,
      "notes": null
    }
  ],
  "applyTo": "catalog|today_plan|template",
  "templateId": null,
  "planDate": null
}

Rules:
- applyTo catalog unless user says "today's workout" (today_plan) or a template name.
- Normalize muscle groups to the enum values.
- No markdown.`;
