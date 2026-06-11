import { Lightbulb, ScanLine, Target } from "lucide-react";

import { staticCompositionFocusTips } from "@/lib/ai/generate-composition-focus-tips";
import {
  computeCompositionScore,
  scoreLabel,
} from "@/lib/measurements/composition-score";
import type { BodyMeasurement, GoalType } from "@/types";

type CompositionFocusTipsProps = {
  goalType: GoalType | null;
  latestMeasurement: BodyMeasurement | null;
};

export function CompositionFocusTips({
  goalType,
  latestMeasurement,
}: CompositionFocusTipsProps) {
  const tips = staticCompositionFocusTips();

  if (latestMeasurement) {
    const score = computeCompositionScore(latestMeasurement);
    if (score != null) {
      tips.focusNext[0] = `Your latest composition score is ${score} (${scoreLabel(score)}) — ${tips.focusNext[0]}`;
    }
  } else if (!goalType) {
    tips.focusNext[1] =
      "Set your fitness goal in Profile so tips match lose fat, muscle gain, or strength.";
  }

  return (
    <section className="rounded-xl bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Coach tips</h3>
          <p className="text-xs text-muted-foreground">
            Based on your latest body composition data
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Target className="size-3.5" />
            What to focus on next
          </div>
          <ul className="space-y-2">
            {tips.focusNext.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm leading-snug text-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ScanLine className="size-3.5" />
            Next scan
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tips.nextScanAdvice}
          </p>
        </div>

        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tips.bmiNote}
          </p>
        </div>
      </div>
    </section>
  );
}
