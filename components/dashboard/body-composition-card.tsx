import { Bone, Droplets, Dumbbell, FlaskConical, Scale } from "lucide-react";
import Link from "next/link";

import { buildBodyCompositionDisplay } from "@/lib/measurements/body-composition-display";
import { cn } from "@/lib/utils";
import type { BodyMeasurement } from "@/types";

const FEATURED_ICONS: Record<string, typeof Droplets> = {
  proteinKg: FlaskConical,
  boneMassKg: Bone,
  bodyWaterKg: Droplets,
  bodyWaterPercent: Droplets,
  muscleMassKg: Dumbbell,
  skeletalMuscleMassKg: Dumbbell,
};

type BodyCompositionCardProps = {
  measurement: BodyMeasurement | null;
};

export function BodyCompositionCard({ measurement }: BodyCompositionCardProps) {
  const display = buildBodyCompositionDisplay(measurement);

  if (!display.hasData) {
    return (
      <section className="rounded-xl bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Scale className="size-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold">Body composition</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Log weight, protein, bone mass, body water, and more from your
              scale or InBody scan.
            </p>
            <Link
              href="/progress/measurements/new"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Log measurement →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const featured = display.composition.filter((m) => m.featured);
  const other = display.composition.filter((m) => !m.featured);

  return (
    <section className="rounded-xl bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Body composition
          </p>
          {display.recordedAtLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Last updated {display.recordedAtLabel}
            </p>
          )}
        </div>
        <Link
          href="/progress"
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Progress
        </Link>
      </div>

      {display.headline.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {display.headline.map((item) => (
            <div
              key={item.id}
              className="rounded-lg bg-muted/60 px-2.5 py-2 text-center"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {featured.map((item) => {
            const Icon = FEATURED_ICONS[item.id] ?? Scale;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border border-border/80 bg-background px-3 py-2.5",
                )}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {other.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-3 text-sm">
          {other.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-2 tabular-nums"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
