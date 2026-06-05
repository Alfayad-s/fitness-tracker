import { Lightbulb, ScanLine, Target } from "lucide-react";

import {
  generateCompositionFocusTips,
  staticCompositionFocusTips,
} from "@/lib/ai/generate-composition-focus-tips";
import type { User } from "@supabase/supabase-js";

type CompositionFocusTipsProps = {
  user: User;
};

export async function CompositionFocusTips({
  user,
}: CompositionFocusTipsProps) {
  let tips = staticCompositionFocusTips();

  try {
    tips = await generateCompositionFocusTips(user);
  } catch {
    // static fallback already set
  }

  return (
    <section className="rounded-xl bg-card p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="size-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI coach tips</h3>
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
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <ScanLine className="size-3.5" />
            Your next scan
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            {tips.nextScanAdvice}
          </p>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            BMI & composition
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground">
            {tips.bmiNote}
          </p>
        </div>
      </div>
    </section>
  );
}

export function CompositionFocusTipsSkeleton() {
  return (
    <section className="rounded-xl bg-card p-4">
      <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </div>
    </section>
  );
}
