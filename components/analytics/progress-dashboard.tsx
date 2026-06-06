"use client";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  useBodyAnalytics,
  useExerciseOptions,
  useExerciseProgressAnalytics,
  useMeasurementHistory,
  useWorkoutAnalytics,
} from "@/hooks/use-analytics";
import {
  getDateRange,
  type DateRangePreset,
} from "@/lib/analytics/date-range";
import type { ProgressInitialData } from "@/lib/analytics/load-progress-initial-data";
import { todayDateString } from "@/lib/workout/format";

type ProgressDashboardProps = {
  initialData?: ProgressInitialData;
};

export function ProgressDashboard({ initialData }: ProgressDashboardProps) {
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(todayDateString());
  const [selectedExerciseId, setSelectedExerciseId] = useState(
    initialData?.exercises[0]?.id ?? "",
  );

  const customRange = { from: customFrom, to: customTo };
  const useInitialData = preset === "30d" && !customFrom;

  const workoutQuery = useWorkoutAnalytics(
    preset,
    customRange,
    useInitialData ? initialData?.workout : undefined,
  );
  const bodyQuery = useBodyAnalytics(
    preset,
    customRange,
    useInitialData ? initialData?.body : undefined,
  );
  const exerciseOptionsQuery = useExerciseOptions(
    useInitialData ? initialData?.exercises : undefined,
  );
  const measurementsQuery = useMeasurementHistory(
    useInitialData ? initialData?.measurements : undefined,
  );

  const exercises = exerciseOptionsQuery.data ?? [];
  const activeExerciseId = selectedExerciseId || exercises[0]?.id || "";

  const exerciseProgressQuery = useExerciseProgressAnalytics(
    activeExerciseId,
    preset,
    customRange,
    useInitialData && activeExerciseId === initialData?.exercises[0]?.id
      ? initialData?.exerciseProgress
      : undefined,
  );

  useEffect(() => {
    if (exercises.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(exercises[0].id);
    }
  }, [exercises, selectedExerciseId]);

  useEffect(() => {
    if (preset === "custom" && !customFrom) {
      const range = getDateRange("30d");
      setCustomFrom(range.from);
    }
  }, [preset, customFrom]);

  const loading =
    workoutQuery.isPending ||
    bodyQuery.isPending ||
    exerciseOptionsQuery.isPending ||
    measurementsQuery.isPending;

  const workout = workoutQuery.data;
  const body = bodyQuery.data;
  const measurements = measurementsQuery.data ?? [];
  const exerciseProgress = exerciseProgressQuery.data;

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
                    value={activeExerciseId}
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
                {exerciseProgressQuery.isFetching && !exerciseProgress ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
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
