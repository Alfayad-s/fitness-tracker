import { z } from "zod";

export const compositionFocusTipsSchema = z.object({
  focusNext: z.array(z.string().min(1)).min(2).max(4),
  nextScanAdvice: z.string().min(1),
  bmiNote: z.string().min(1),
});

export type CompositionFocusTips = z.infer<typeof compositionFocusTipsSchema>;
