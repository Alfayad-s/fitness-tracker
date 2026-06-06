"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import type { BodyTrendPoint } from "@/types/analytics";

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type BodyWeightChartProps = {
  data: BodyTrendPoint[];
};

export function BodyWeightChart({ data }: BodyWeightChartProps) {
  const hasWeight = data.some((p) => p.weightKg != null);
  const hasBodyFat = data.some((p) => p.bodyFatPercent != null);

  if (data.length === 0 || (!hasWeight && !hasBodyFat)) {
    return (
      <ChartEmpty message="Log body measurements to see weight and body fat trends." />
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    label: formatDateLabel(p.date),
  }));

  return (
    <div
      className="h-52 w-full"
      role="img"
      aria-label="Body weight and body fat trend chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          {hasBodyFat && (
            <YAxis
              yAxisId="fat"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
          )}
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {hasWeight && (
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weightKg"
              name="Weight (kg)"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          )}
          {hasBodyFat && (
            <Line
              yAxisId="fat"
              type="monotone"
              dataKey="bodyFatPercent"
              name="Body fat %"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
