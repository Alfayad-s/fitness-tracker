"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import type { WeeklyFrequencyPoint } from "@/types/analytics";

function formatWeekLabel(week: string): string {
  const d = new Date(`${week}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type WorkoutFrequencyChartProps = {
  data: WeeklyFrequencyPoint[];
};

export function WorkoutFrequencyChart({ data }: WorkoutFrequencyChartProps) {
  if (data.length === 0) {
    return (
      <ChartEmpty message="Complete workouts to see how often you train each week." />
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatWeekLabel(d.week),
  }));

  return (
    <div
      className="h-52 w-full"
      role="img"
      aria-label="Workout sessions per week chart"
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
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            formatter={(value) => [value ?? 0, "Sessions"]}
            labelFormatter={(label) => `Week of ${label}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
