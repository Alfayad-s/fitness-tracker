"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import { scoreLabel, scoreTheme } from "@/lib/measurements/composition-score";
import { cn } from "@/lib/utils";
import type { BodyCompositionTrendPoint } from "@/types/analytics";

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type BodyCompositionScoreChartProps = {
  data: BodyCompositionTrendPoint[];
  /** When false, score is shown in CompositionScoreHero above daily targets. */
  showHeader?: boolean;
};

export function BodyCompositionScoreChart({
  data,
  showHeader = false,
}: BodyCompositionScoreChartProps) {
  const scorePoints = data.filter((p) => p.score != null);

  if (scorePoints.length === 0) {
    return (
      <ChartEmpty message="Log body composition (BMA scan or manual) to see your score trend." />
    );
  }

  const chartData = scorePoints.map((p) => ({
    ...p,
    label: formatDateLabel(p.date),
  }));

  const latestScore = chartData[chartData.length - 1]?.score ?? null;
  const showTrend = chartData.length >= 2;
  const theme = latestScore != null ? scoreTheme(latestScore) : null;
  const gradientId = `scoreFill-${latestScore ?? "default"}`;

  return (
    <div className="space-y-3">
      {showHeader && latestScore != null && theme && (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Composition score
            </p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  theme.text,
                )}
              >
                {latestScore}
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {scoreLabel(latestScore)} · indicative trend from your logs
            </p>
          </div>
        </div>
      )}

      {showTrend && theme ? (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.chartFillTop} />
                  <stop offset="100%" stopColor={theme.chartFillBottom} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <ReferenceLine
                y={70}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as (typeof chartData)[0];
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                      <p className="font-medium">{row.label}</p>
                      {row.score != null && (
                        <p className="mt-1 tabular-nums">
                          Score: <strong>{row.score}</strong> (
                          {scoreLabel(row.score)})
                        </p>
                      )}
                      {row.proteinKg != null && (
                        <p className="text-muted-foreground">
                          Protein: {row.proteinKg} kg
                        </p>
                      )}
                      {row.bodyWaterKg != null && (
                        <p className="text-muted-foreground">
                          Body water: {row.bodyWaterKg} kg
                        </p>
                      )}
                      {row.boneMassKg != null && (
                        <p className="text-muted-foreground">
                          Bone: {row.boneMassKg} kg
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={theme.chartStroke}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 4, fill: theme.chartStroke, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-center text-xs text-muted-foreground">
          Log another measurement to see your score trend over time.
        </p>
      )}

      {showTrend && (
        <BodyCompositionMetricsChart data={data} />
      )}
    </div>
  );
}

function BodyCompositionMetricsChart({
  data,
}: {
  data: BodyCompositionTrendPoint[];
}) {
  const hasProtein = data.some((p) => p.proteinKg != null);
  const hasWater = data.some((p) => p.bodyWaterKg != null);
  const hasBone = data.some((p) => p.boneMassKg != null);
  const hasMuscle = data.some((p) => p.muscleMassKg != null);

  if (!hasProtein && !hasWater && !hasBone && !hasMuscle) {
    return null;
  }

  const chartData = data.map((p) => ({
    ...p,
    label: formatDateLabel(p.date),
  }));

  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Protein · water · bone · muscle
      </p>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={32}
              unit=" kg"
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--card)",
                fontSize: 12,
              }}
            />
            {hasProtein && (
              <Line
                type="monotone"
                dataKey="proteinKg"
                name="Protein (kg)"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            )}
            {hasWater && (
              <Line
                type="monotone"
                dataKey="bodyWaterKg"
                name="Water (kg)"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            )}
            {hasBone && (
              <Line
                type="monotone"
                dataKey="boneMassKg"
                name="Bone (kg)"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            )}
            {hasMuscle && (
              <Line
                type="monotone"
                dataKey="muscleMassKg"
                name="Muscle (kg)"
                stroke="var(--chart-4)"
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
