import Link from "next/link";
import { Scale } from "lucide-react";

import { BodyCompositionBodyVisual } from "@/components/dashboard/body-composition-body-visual";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BodyCompositionBodyData } from "@/lib/measurements/body-composition-body-map";
import { scoreLabel, scoreTheme } from "@/lib/measurements/composition-score";
import { cn } from "@/lib/utils";

type BodyCompositionVisualProps = {
  data: BodyCompositionBodyData;
  hasCompositionData: boolean;
  compositionScore: number | null;
  recordedAtLabel?: string | null;
};

export function BodyCompositionVisual({
  data,
  hasCompositionData,
  compositionScore,
  recordedAtLabel,
}: BodyCompositionVisualProps) {
  const scoreThemeClasses =
    compositionScore != null ? scoreTheme(compositionScore) : null;

  return (
    <Card className="ring-0">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-0">
        <div className="min-w-0 flex-1 text-left">
          <CardTitle className="text-base">Body composition</CardTitle>
          {hasCompositionData && recordedAtLabel ? (
            <CardDescription>Latest scan · {recordedAtLabel}</CardDescription>
          ) : (
            <CardDescription>
              Log a BMA or InBody scan to map water, fat, bone, and protein on
              your body.
            </CardDescription>
          )}
        </div>
        {compositionScore != null && scoreThemeClasses ? (
          <div
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-center",
              scoreThemeClasses.bg,
            )}
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Score
            </p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none",
                scoreThemeClasses.text,
              )}
            >
              {compositionScore}
            </p>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                scoreThemeClasses.badge,
              )}
            >
              {scoreLabel(compositionScore)}
            </span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="pb-4">
        {!hasCompositionData ? (
          <Link
            href="/progress/measurements/new"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Scale className="size-4" />
            Log measurement
          </Link>
        ) : null}
        <BodyCompositionBodyVisual data={data} />
      </CardContent>
    </Card>
  );
}
