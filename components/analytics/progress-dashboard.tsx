"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { BodyWeightChart } from "@/components/analytics/body-weight-chart";
import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { ExerciseProgressChart } from "@/components/analytics/exercise-progress-chart";
import { MeasurementsHistory } from "@/components/analytics/measurements-history";
import { StatSummary } from "@/components/analytics/stat-summary";
import { VolumeChart } from "@/components/analytics/volume-chart";
import { WorkoutFrequencyChart } from "@/components/analytics/workout-frequency-chart";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getDateRange,
  type DateRangePreset,
} from "@/lib/analytics/date-range";
import { todayDateString } from "@/lib/workout/format";
import {
  fetchBodyAnalytics,
  fetchExerciseOptions,
  fetchExerciseProgress,
  fetchWorkoutAnalytics,
} from "@/services/analytics-actions";
import { fetchMeasurementHistory } from "@/services/measurement-actions";
import type {
  BodyAnalyticsSummary,
  ExerciseOption,
  ExerciseProgressSummary,
  WorkoutAnalyticsSummary,
} from "@/types/analytics";
import type { BodyMeasurement } from "@/types";

export function ProgressDashboard() {
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(todayDateString());
  const [loading, setLoading] = useState(true);

  const [workout, setWorkout] = useState<WorkoutAnalyticsSummary | null>(null);
  const [body, setBody] = useState<BodyAnalyticsSummary | null>(null);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [exerciseProgress, setExerciseProgress] =
    useState<ExerciseProgressSummary | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  const customRange = { from: customFrom, to: customTo };

  const load = useCallback(async () => {
    setLoading(true);

    const [workoutRes, bodyRes, exerciseOpts, historyRes] = await Promise.all([
      fetchWorkoutAnalytics(preset, customRange),
      fetchBodyAnalytics(preset, customRange),
      fetchExerciseOptions(),
      fetchMeasurementHistory(),
    ]);

    if (workoutRes.data) setWorkout(workoutRes.data);
    if (bodyRes.data) setBody(bodyRes.data);
    if (exerciseOpts.exercises.length > 0) {
      setExercises(exerciseOpts.exercises);
      setSelectedExerciseId((prev) => prev || exerciseOpts.exercises[0].id);
    }
    if (historyRes.measurements) setMeasurements(historyRes.measurements);

    setLoading(false);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedExerciseId) {
      setExerciseProgress(null);
      return;
    }

    let cancelled = false;

    void fetchExerciseProgress(
      selectedExerciseId,
      preset,
      customRange,
    ).then((res) => {
      if (!cancelled && res.data) setExerciseProgress(res.data);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedExerciseId, preset, customFrom, customTo]);

  useEffect(() => {
    if (preset === "custom" && !customFrom) {
      const range = getDateRange("30d");
      setCustomFrom(range.from);
    }
  }, [preset, customFrom]);

  return (
    <div className="space-y-6">
      <DateRangeFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPresetChange={setPreset}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="workouts" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="workouts" className="flex-1">
              Workouts
            </TabsTrigger>
            <TabsTrigger value="body" className="flex-1">
              Body
            </TabsTrigger>
            <TabsTrigger value="exercises" className="flex-1">
              Exercises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workouts" className="space-y-6">
            {workout && (
              <>
                <StatSummary
                  items={[
                    { label: "Workouts", value: String(workout.totalWorkouts) },
                    {
                      label: "Volume",
                      value: `${workout.totalVolumeKg.toLocaleString()} kg`,
                    },
                    {
                      label: "Streak",
                      value: `${workout.currentStreak} days`,
                    },
                    {
                      label: "Best streak",
                      value: `${workout.longestStreak} days`,
                    },
                  ]}
                />
                <section className="space-y-2">
                  <h2 className="text-sm font-medium">Weekly volume</h2>
                  <VolumeChart data={workout.weeklyVolume} />
                </section>
                <section className="space-y-2">
                  <h2 className="text-sm font-medium">Sessions per week</h2>
                  <WorkoutFrequencyChart data={workout.weeklyFrequency} />
                </section>
              </>
            )}
          </TabsContent>

          <TabsContent value="body" className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium">Body trends</h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/progress/measurements/new">
                  <Plus className="size-4" />
                  Log
                </Link>
              </Button>
            </div>
            {body && <BodyWeightChart data={body.points} />}
            <section className="space-y-2">
              <h2 className="text-sm font-medium">History</h2>
              <MeasurementsHistory measurements={measurements} />
            </section>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4">
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Log workouts with exercises to see progress charts.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="exercise-select" className="text-sm font-medium">
                    Exercise
                  </label>
                  <select
                    id="exercise-select"
                    value={selectedExerciseId}
                    onChange={(e) => setSelectedExerciseId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                </div>
                {exerciseProgress && (
                  <ExerciseProgressChart
                    data={exerciseProgress.points}
                    exerciseName={exerciseProgress.exerciseName}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
