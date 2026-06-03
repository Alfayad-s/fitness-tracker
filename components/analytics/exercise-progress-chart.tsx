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
import type { ExerciseProgressPoint } from "@/types/analytics";

function formatDateLabel(date: string): string {
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type ExerciseProgressChartProps = {
  data: ExerciseProgressPoint[];
  exerciseName: string;
};

export function ExerciseProgressChart({
  data,
  exerciseName,
}: ExerciseProgressChartProps) {
  if (data.length === 0) {
    return (
      <ChartEmpty
        message={`No logged sets for ${exerciseName} in this period.`}
      />
    );
  }

  const chartData = data.map((p) => ({
    ...p,
    label: formatDateLabel(p.date),
  }));

  return (
    <div className="h-52 w-full">
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
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--card)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="maxWeightKg"
            name="Max weight (kg)"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="estimated1RmKg"
            name="Est. 1RM (kg)"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={{ r: 3 }}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
