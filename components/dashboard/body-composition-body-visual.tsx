"use client";

import dynamic from "next/dynamic";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type {
  BodyCompositionBodyData,
  BodyPartId,
} from "@/lib/measurements/body-composition-body-map";
import { formatBodyPartLabel } from "@/lib/measurements/body-composition-body-map";
import {
  ALL_BODY_PART_IDS,
  buildBodyCompositionFillCss,
  COMPOSITION_FILL_COLORS,
  getPartCompositionFill,
} from "@/lib/measurements/body-composition-fill";
import { cn } from "@/lib/utils";

const BodyComponent = dynamic(
  () =>
    import("@darshanpatel2608/human-body-react").then((mod) => mod.BodyComponent),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[320px] w-[140px] animate-pulse rounded-xl bg-muted"
        aria-hidden
      />
    ),
  },
);

type BodyCompositionBodyVisualProps = {
  data: BodyCompositionBodyData;
};

type StatCardConfig = {
  id: string;
  label: string;
  value: string | null;
  subValue?: string | null;
  accentColor?: string;
  className?: string;
};

export function BodyCompositionBodyVisual({
  data,
}: BodyCompositionBodyVisualProps) {
  const [activePartId, setActivePartId] = useState<BodyPartId | null>(null);
  const bodyContainerRef = useRef<HTMLDivElement>(null);

  const activePart = activePartId ? data.partsInput[activePartId] : null;
  const activeEstimate = activePartId ? data.partEstimates[activePartId] : null;

  const bodyKey = useMemo(
    () =>
      [
        data.heightCm,
        data.weightKg,
        data.bodyWaterPercent,
        data.bodyFatPercent,
        data.proteinPercent,
        data.bonePercent,
        ...data.metrics.map((m) => `${m.id}:${m.massKg}`),
      ].join("|"),
    [
      data.heightCm,
      data.weightKg,
      data.bodyWaterPercent,
      data.bodyFatPercent,
      data.proteinPercent,
      data.bonePercent,
      data.metrics,
    ],
  );

  const compositionFillCss = useMemo(
    () => buildBodyCompositionFillCss(data.compositionStack),
    [data.compositionStack],
  );

  const hasCompositionFill = data.compositionStack.layers.length > 0;

  const metricById = useMemo(
    () => new Map(data.metrics.map((metric) => [metric.id, metric])),
    [data.metrics],
  );

  const statCards = useMemo((): StatCardConfig[] => {
    const cards: StatCardConfig[] = [];

    const compositionCards: {
      id: string;
      label: string;
      percent: number | null;
      metricId: keyof typeof COMPOSITION_FILL_COLORS;
      className: string;
    }[] = [
      {
        id: "bodyWater",
        label: "Body water",
        percent: data.bodyWaterPercent,
        metricId: "bodyWater",
        className: "bg-sky-500/10 text-sky-900",
      },
      {
        id: "bodyFat",
        label: "Body fat",
        percent: data.bodyFatPercent,
        metricId: "bodyFat",
        className: "bg-orange-500/10 text-orange-900",
      },
      {
        id: "protein",
        label: "Protein",
        percent: data.proteinPercent,
        metricId: "protein",
        className: "bg-purple-500/10 text-purple-900",
      },
      {
        id: "boneMass",
        label: "Bone mass",
        percent: data.bonePercent,
        metricId: "boneMass",
        className: "bg-emerald-500/10 text-emerald-900",
      },
    ];

    for (const card of compositionCards) {
      if (card.percent == null) continue;
      const metric = metricById.get(
        card.metricId as "bodyWater" | "bodyFat" | "protein" | "boneMass",
      );
      cards.push({
        id: card.id,
        label: card.label,
        value: `${card.percent}%`,
        subValue: metric ? `${metric.massKg} kg` : null,
        accentColor: COMPOSITION_FILL_COLORS[card.metricId],
        className: card.className,
      });
    }

    for (const extra of data.extraStats) {
      cards.push({
        id: extra.id,
        label: extra.label,
        value: extra.value,
        subValue: extra.subValue,
        accentColor: extra.accentColor,
        className: extra.className,
      });
    }

    return cards;
  }, [
    data.bodyWaterPercent,
    data.bodyFatPercent,
    data.proteinPercent,
    data.bonePercent,
    data.extraStats,
    metricById,
  ]);

  useLayoutEffect(() => {
    const root = bodyContainerRef.current;
    if (!root || !hasCompositionFill) return;

    const paint = () => {
      for (const partId of ALL_BODY_PART_IDS) {
        const path = root.querySelector<SVGPathElement>(
          `path#${CSS.escape(partId)}`,
        );
        if (!path) continue;

        const { fillColor } = getPartCompositionFill(
          partId,
          data.compositionStack,
        );
        path.style.setProperty("fill", fillColor, "important");
      }
    };

    paint();

    const observer = new MutationObserver(paint);
    observer.observe(root, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [data.compositionStack, hasCompositionFill, bodyKey]);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex min-h-0 flex-row items-stretch gap-3">
        <div className="flex w-[42%] max-w-[180px] shrink-0 flex-col items-start">
          <div
            ref={bodyContainerRef}
            className="body-composition-human body-composition-human--left w-full max-w-[180px]"
            data-composition={hasCompositionFill ? "" : undefined}
          >
            {compositionFillCss ? <style>{compositionFillCss}</style> : null}
            <BodyComponent
              key={bodyKey}
              partsInput={data.partsInput}
              width="100%"
              height="320px"
              onClick={(partId: string) => {
                if (partId in data.partsInput) {
                  setActivePartId(partId as BodyPartId);
                }
              }}
            />
          </div>

          {data.heightCm != null || data.weightKg != null ? (
            <div className="mt-2 flex w-full gap-2">
              {data.heightCm != null ? (
                <div className="flex-1 rounded-lg bg-muted/50 px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">Height</p>
                  <p className="text-xs font-semibold tabular-nums">
                    {data.heightCm} cm
                  </p>
                </div>
              ) : null}
              {data.weightKg != null ? (
                <div className="flex-1 rounded-lg bg-muted/50 px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">Weight</p>
                  <p className="text-xs font-semibold tabular-nums">
                    {data.weightKg} kg
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 min-w-0 flex-1">
          <div className="composition-stat-scroll flex max-h-[372px] flex-col gap-1.5 overflow-y-auto overscroll-y-contain pr-1 touch-pan-y">
            {statCards.length > 0 ? (
              statCards.map((card) => (
                <div
                  key={card.id}
                  className={cn(
                    "shrink-0 flex items-center gap-2.5 rounded-lg px-2.5 py-2",
                    card.className,
                  )}
                >
                  {card.accentColor ? (
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: card.accentColor }}
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="size-3 shrink-0 rounded-full bg-muted-foreground/30"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-[11px] text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {card.value}
                    </p>
                    {card.subValue ? (
                      <p className="text-[10px] tabular-nums text-muted-foreground">
                        {card.subValue}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Add height on Profile and log a BMA scan to see your composition
                breakdown.
              </p>
            )}
          </div>
        </div>
      </div>

      {activePart && activeEstimate ? (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">
            {activeEstimate.label ||
              activePart.label ||
              formatBodyPartLabel(activePartId ?? "")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimated composition in this region from your latest scan
          </p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {activeEstimate.metrics.map((metric) => (
              <li
                key={metric.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-sm"
                    style={{ backgroundColor: metric.color }}
                    aria-hidden
                  />
                  <span className="truncate">{metric.label}</span>
                </span>
                <span className="shrink-0 text-right font-medium tabular-nums">
                  {metric.massKg} kg
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {metric.shareOfPart}% of region
                    {metric.percentOfBody != null
                      ? ` · ${metric.percentOfBody}% body`
                      : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Regional estimate total: {activeEstimate.estimatedPartMassKg} kg
          </p>
        </div>
      ) : activePart ? (
        <p className="text-xs text-muted-foreground">
          Log a BMA scan to estimate water, fat, protein, and bone for each
          body region
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tap a body region to see estimated water, fat, protein, and bone mass
        </p>
      )}
    </div>
  );
}
