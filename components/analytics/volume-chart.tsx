"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmpty } from "@/components/analytics/chart-empty";
import type { WeeklyVolumePoint } from "@/types/analytics";

function formatWeekLabel(week: string): string {
  const d = new Date(`${week}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type VolumeChartProps = {
  data: WeeklyVolumePoint[];
};

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <ChartEmpty message="Log workouts with sets to see weekly training volume." />
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatWeekLabel(d.week),
  }));

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) => [`${value ?? 0} kg`, "Volume"]}
            labelFormatter={(label) => `Week of ${label}`}
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Bar
            dataKey="volumeKg"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            name="Volume"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
